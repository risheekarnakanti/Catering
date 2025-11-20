import json
import os
import re
import uuid
from datetime import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

# --- DynamoDB Table Setup from Environment Variables ---
ORDERS_TABLE_NAME = os.environ.get('ORDERS_TABLE')
MENU_TABLE_NAME = os.environ.get('MENU_ITEMS_TABLE')

dynamodb = boto3.resource('dynamodb')
orders_table = dynamodb.Table(ORDERS_TABLE_NAME)
menu_table = dynamodb.Table(MENU_TABLE_NAME)


def create_response(status_code, body):
    """Formats the API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True,
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps(body, default=str)
    }

def create_menu_item_logic(event):
    """Creates a new menu item in the dedicated 'MenuItems' table."""
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return create_response(400, {'message': 'Invalid JSON.'})

    item_name = body.get('itemName')
    pricing = body.get('pricing')
    if not item_name or not isinstance(pricing, list) or not pricing:
        return create_response(400, {'message': 'itemName and at least one pricing option are required.'})

    slug = re.sub(r'[^a-z0-9]+', '-', item_name.lower()).strip('-')
    
    validated_pricing = []
    for p in pricing:
        if not p.get('sizeName') or 'price' not in p:
            return create_response(400, {'message': 'Each price option needs a sizeName and a price.'})
        validated_pricing.append({'sizeName': p['sizeName'], 'price': Decimal(str(p['price']))})

    menu_item = {
        'PK': 'MENU',
        'SK': f'ITEM#{slug}',
        'itemName': item_name,
        'description': body.get('description', ''),
        'pricing': validated_pricing,
        'isAvailable': True # Default to available on creation
    }

    try:
        # --- MODIFIED: Write to menu_table ---
        menu_table.put_item(Item=menu_item)
        return create_response(201, menu_item)
    except ClientError as e:
        print(f"Error creating menu item: {e}")
        return create_response(500, {'message': 'Could not create the menu item.'})

def create_order_logic(event):
    """Creates an order. Securely validates price based on sizeName and records spiceLevel."""
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return create_response(400, {'message': 'Invalid JSON format.'})
    
    customer_name = body.get('customerName')
    customer_phone = body.get('customerPhone')
    customer_email = body.get('customerEmail')
    delivery_date = body.get('deliveryDate')
    delivery_time = body.get('deliveryTime')
    items_from_client = body.get('items')
    delivery_type = body.get('deliveryType', 'Pickup')
    delivery_address = body.get('deliveryAddress', '')
    
    if not all([customer_name, customer_phone, customer_email, delivery_date, delivery_time, items_from_client]):
        return create_response(400, {'message': 'Missing required fields.'})
    
    try:
        # Fetch menu items for validation
        menu_response = menu_table.query(KeyConditionExpression=Key('PK').eq('MENU'))
        menu_lookup = {item['SK']: item for item in menu_response.get('Items', [])}
        if not menu_lookup:
            raise ValueError("Menu could not be loaded from the database.")
        
        total_price = Decimal('0')
        order_items_to_save = []
        
        # Process each item from the cart
        for index, item in enumerate(items_from_client):
            item_id_sk = f"ITEM#{item['menuItemId']}"
            size_name_from_client = item['sizeName']
            spice_level = item.get('spiceLevel', 'Not Specified')
            
            menu_item = menu_lookup.get(item_id_sk)
            if not menu_item or not menu_item.get('isAvailable', False):
                raise ValueError(f"Invalid or unavailable item ID: {item['menuItemId']}")
            
            price_option = next((p for p in menu_item.get('pricing', []) if p['sizeName'] == size_name_from_client), None)
            if not price_option:
                raise ValueError(f"Invalid size '{size_name_from_client}' for item '{menu_item['itemName']}'")
            
            quantity = int(item['quantity'])
            price = Decimal(str(price_option['price']))
            total_price += price * quantity
            
            # Create unique SK for each line item: ITEM#<index>#<itemId>
            # This allows the same item with same size to appear multiple times
            unique_item_sk = f"ITEM#{index}#{item['menuItemId']}"
            
            order_item = {
                'SK': unique_item_sk,
                'itemName': f"{menu_item['itemName']} ({size_name_from_client}, {spice_level})",
                'quantity': quantity,
                'price': price
            }
            
            if 'instructions' in item and item['instructions']:
                order_item['instructions'] = item['instructions']
            
            order_items_to_save.append(order_item)
    
    except (ValueError, TypeError, KeyError) as e:
        print(f"Error processing order items: {e}")
        return create_response(400, {'message': str(e)})
    
    # Generate unique order ID
    order_id = str(uuid.uuid4())
    order_pk = f"ORDER#{order_id}"
    
    # Create order record
    order_record = {
        'PK': order_pk,
        'SK': order_pk,
        'orderId': order_id,
        'customerName': customer_name,
        'customerPhone': customer_phone,
        'customerEmail': customer_email,
        'deliveryDate': delivery_date,
        'deliveryTime': delivery_time,
        'totalPrice': total_price,
        'status': 'NEW',
        'customerSpecifications': body.get('customerSpecifications', ''),
        'deliveryType': delivery_type,
        'deliveryAddress': delivery_address,
        'createdAt': datetime.utcnow().isoformat()
    }
    
    try:
        with orders_table.batch_writer() as batch:
            # Save the order record
            batch.put_item(Item=order_record)
            
            # Save each item line with unique SK
            for item in order_items_to_save:
                item['PK'] = order_pk
                batch.put_item(Item=item)
    
    except ClientError as e:
        print(f"Error saving order: {e}")
        return create_response(500, {'message': 'Failed to save order.'})
    
    return create_response(201, order_record)

    
def get_menu_items_logic(event):
    """Retrieves all available menu items from the 'MenuItems' table."""
    try:
        # --- MODIFIED: Query menu_table ---
        response = menu_table.query(
            KeyConditionExpression=Key('PK').eq('MENU'),
            FilterExpression=Attr('isAvailable').eq(True)
        )
        return create_response(200, response.get('Items', []))
    except ClientError as e:
        print(f"Error retrieving menu: {e}")
        return create_response(500, {'message': 'Could not retrieve the menu.'})

def get_order_details_logic(event):
    """Retrieves a specific order's details from the 'Orders' table."""
    try:
        order_id = event['pathParameters']['id']
    except KeyError:
        return create_response(400, {'message': 'Order ID is required.'})
    
    order_pk = f"ORDER#{order_id}"
    try:
        # --- UNCHANGED: Queries orders_table ---
        response = orders_table.query(KeyConditionExpression=Key('PK').eq(order_pk))
        return create_response(200, response.get('Items', []))
    except ClientError as e:
        return create_response(500, {'message': 'Could not retrieve order details.'})

def get_orders_by_date_logic(event):
    """Retrieves orders for a specific date from the 'Orders' table."""
    try:
        date = event['pathParameters']['date']
    except KeyError:
        return create_response(400, {'message': 'Date parameter is required.'})
        
    try:
        # --- UNCHANGED: Queries orders_table ---
        response = orders_table.query(
            IndexName='DateIndex', # Assumes a GSI named 'DateIndex' exists on the orders table
            KeyConditionExpression=Key('deliveryDate').eq(date)
        )
        return create_response(200, response.get('Items', []))
    except ClientError as e:
        print(f"Error retrieving orders by date: {e}")
        return create_response(500, {'message': 'Failed to retrieve orders.'})

def handler(event, context):
    """Main API Gateway router."""
    http_method = event.get('httpMethod')
    resource = event.get('resource')
    
    # --- Menu Routes ---
    if http_method == 'POST' and resource == '/menu':
        return create_menu_item_logic(event)
    elif http_method == 'GET' and resource == '/menu':
        return get_menu_items_logic(event)
        
    # --- Order Routes ---
    elif http_method == 'POST' and resource == '/orders':
        return create_order_logic(event)
    elif http_method == 'GET' and resource == '/orders/{date}':
        return get_orders_by_date_logic(event)
    elif http_method == 'GET' and resource == '/order/{id}':
        return get_order_details_logic(event)
        
    # --- Pre-flight OPTIONS for CORS ---
    elif http_method == 'OPTIONS':
        return create_response(200, {})
        
    else:
        return create_response(404, {'message': f"Unsupported route: '{http_method} {resource}'"})