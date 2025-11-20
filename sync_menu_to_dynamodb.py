import boto3
import csv
import os
from decimal import Decimal

def csv_to_dynamodb(csv_file_path, table_name, region_name='us-east-1'):
    """
    Reads a CSV file, validates each row for required keys, and populates a DynamoDB table.
    """
    dynamodb = boto3.resource('dynamodb', region_name=region_name)
    table = dynamodb.Table(table_name)
    
    print(f"Starting sync for '{csv_file_path}' to DynamoDB table '{table_name}'...")

    try:
        with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            items_to_write = []
            
            # Enumerate to get the line number for helpful error messages
            for i, row in enumerate(reader, start=2): # Starts at line 2 (after the header)
                
                # --- THIS IS THE CRITICAL VALIDATION STEP ---
                # Check if the PK or SK columns are empty or missing for this row.
                if not row.get('PK') or not row.get('SK'):
                    print(f"\n--> VALIDATION ERROR: Skipping row {i} because PK or SK is empty.")
                    print(f"    Content of bad row: {row}\n")
                    continue # Skip this loop iteration and go to the next row

                # If validation passes, build the item
                pricing = []
                for j in range(1, 10):
                    size_col = f'sizeName_{j}'
                    price_col = f'price_{j}'
                    
                    if row.get(size_col) and row.get(price_col):
                        try:
                            pricing.append({
                                'sizeName': row[size_col],
                                'price': Decimal(row[price_col])
                            })
                        except Exception as e:
                            print(f"Warning: Could not process price on row {i}. Value: '{row[price_col]}'. Error: {e}")

                item = {
                    'PK': row['PK'],
                    'SK': row['SK'],
                    'itemName': row['itemName'],
                    'description': row.get('description', ''),
                    'itemCategory': row.get('itemCategory', 'Uncategorized'),
                    'itemType': row.get('itemType', 'General'),
                    'isAvailable': row['isAvailable'].strip().upper() == 'TRUE',
                    'pricing': pricing
                }
                items_to_write.append(item)

            # Now, write all the validated items to DynamoDB in a batch
            if items_to_write:
                with table.batch_writer() as batch:
                    for item in items_to_write:
                        batch.put_item(Item=item)
                print(f"Successfully wrote {len(items_to_write)} items to DynamoDB.")
            else:
                print("No valid items were found in the CSV to write.")

        print("Sync script finished.")

    except FileNotFoundError:
        print(f"Error: The file was not found at {csv_file_path}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    CSV_FILE = os.path.join(script_dir, 'menu_template.csv')
    DYNAMODB_TABLE = 'MenuItems'
    REGION = 'us-east-1'
    
    csv_to_dynamodb(CSV_FILE, DYNAMODB_TABLE, REGION)


