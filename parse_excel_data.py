import pandas as pd
import json
import re
from datetime import datetime

def clean_value(val):
    """Clean and convert values"""
    if pd.isna(val) or val == 'NaN' or val == 'nan':
        return None
    if isinstance(val, str):
        val = val.strip()
        if val.lower() in ['nil', 'nan', '', 'na', 'n/a']:
            return None
    return val

def parse_date(date_str):
    """Parse date from various formats"""
    if not date_str or pd.isna(date_str):
        return None
    
    try:
        if isinstance(date_str, datetime):
            return date_str.strftime('%Y-%m-%d')
        
        date_str = str(date_str).strip()
        
        # Try different date formats
        for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']:
            try:
                return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
            except:
                continue
        
        # Extract date from string like "2002-09-02 00:00:00"
        match = re.search(r'(\d{4}-\d{2}-\d{2})', date_str)
        if match:
            return match.group(1)
            
    except:
        pass
    
    return None

def extract_po_info(po_str):
    """Extract PO number and date"""
    if not po_str or pd.isna(po_str):
        return None, None
    
    po_str = str(po_str).strip()
    
    # Extract PO number
    po_match = re.search(r'Po\s*No[:\s]*(\d+)', po_str, re.IGNORECASE)
    po_number = po_match.group(1) if po_match else po_str
    
    # Extract date
    date_match = re.search(r'(\d{2}[-/]\d{2}[-/]\d{4})', po_str)
    po_date = None
    if date_match:
        try:
            po_date = datetime.strptime(date_match.group(1).replace('/', '-'), '%d-%m-%Y').strftime('%Y-%m-%d')
        except:
            pass
    
    return po_number, po_date

def parse_sheet(file_path, sheet_name, asset_type, branch_id=1):
    """Parse a specific sheet and extract asset data"""
    df = pd.read_excel(file_path, sheet_name=sheet_name)
    
    # Skip header rows and find the actual data start
    data_start = 0
    for i, row in df.iterrows():
        if 'S.No.' in str(row.values) or 'Name of the Equipment' in str(row.values):
            data_start = i + 1
            break
    
    if data_start == 0:
        return []
    
    # Get column headers
    headers = df.iloc[data_start - 1].values
    df = df.iloc[data_start:].reset_index(drop=True)
    
    assets = []
    
    for idx, row in df.iterrows():
        # Skip empty rows
        if pd.isna(row.iloc[1]) and pd.isna(row.iloc[2]):
            continue
        
        try:
            # Extract data based on column positions
            name = clean_value(row.iloc[2]) if len(row) > 2 else None
            if not name:
                continue
            
            qty = clean_value(row.iloc[3]) if len(row) > 3 else 1
            po_info = clean_value(row.iloc[4]) if len(row) > 4 else None
            supplier = clean_value(row.iloc[5]) if len(row) > 5 else None
            invoice_info = clean_value(row.iloc[6]) if len(row) > 6 else None
            purchase_value = clean_value(row.iloc[7]) if len(row) > 7 else None
            location = clean_value(row.iloc[9]) if len(row) > 9 else None
            serial_number = clean_value(row.iloc[10]) if len(row) > 10 else None
            ams_barcode = clean_value(row.iloc[11]) if len(row) > 11 else None
            status = clean_value(row.iloc[12]) if len(row) > 12 else 'Working'
            remarks = clean_value(row.iloc[16]) if len(row) > 16 else None
            
            # Parse PO info
            po_number, po_date = extract_po_info(po_info)
            
            # Parse invoice date
            invoice_date = parse_date(invoice_info)
            
            # Determine status
            if status:
                status_lower = str(status).lower()
                if 'not' in status_lower or 'obsolete' in status_lower:
                    current_status = 'Obsolete' if 'obsolete' in status_lower else 'Not Working'
                else:
                    current_status = 'Working'
            else:
                current_status = 'Working'
            
            # Convert quantity
            try:
                qty = int(float(qty)) if qty else 1
            except:
                qty = 1
            
            # Convert purchase value
            try:
                purchase_value = float(purchase_value) if purchase_value else None
            except:
                purchase_value = None
            
            asset = {
                'asset_type': asset_type,
                'name': name,
                'quantity': qty,
                'branch_id': branch_id,
                'location': location,
                'serial_number': serial_number,
                'ams_barcode': ams_barcode,
                'po_number': po_number,
                'po_date': po_date,
                'invoice_date': invoice_date,
                'purchase_value': purchase_value,
                'current_status': current_status,
                'remarks': remarks,
                'supplier_name': supplier
            }
            
            assets.append(asset)
            
        except Exception as e:
            print(f"Error parsing row {idx} in {sheet_name}: {e}")
            continue
    
    return assets

# Main execution
file_path = r"C:\Users\vx105\Desktop\STPI-ASSET-TRACKER\public\Fixed Assets Physical verification-Hyderabad FY 2024-25-latest.xlsx"

all_assets = []

# Parse each sheet
sheet_mappings = {
    'HSDC-Equipments': 'HSDC',
    'Computers-peripherals': 'COMPUTER',
    'Electrical-Equipments': 'ELECTRICAL',
    'Office Equipments': 'OFFICE',
    'Furnitures-Fixtures-Misc': 'FURNITURE',
    'Fire-Fighting': 'FIREFIGHTING',
    'Building': 'BUILDING'
}

for sheet_name, asset_type in sheet_mappings.items():
    print(f"Processing {sheet_name}...")
    assets = parse_sheet(file_path, sheet_name, asset_type)
    all_assets.extend(assets)
    print(f"  Found {len(assets)} assets")

print(f"\nTotal assets extracted: {len(all_assets)}")

# Save to JSON
output_file = 'assets_seed_data.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(all_assets, f, indent=2, ensure_ascii=False)

print(f"Data saved to {output_file}")

# Print sample
if all_assets:
    print("\nSample asset:")
    print(json.dumps(all_assets[0], indent=2))
