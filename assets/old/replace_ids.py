import csv
import json

# File paths
csv_file = 'c:/Users/Pc/Desktop/goldrart/products.csv'
json_file = 'c:/Users/Pc/Desktop/goldrart/products.applied.json'

# Create mapping from CSV
mapping = {}
with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        mapping[row['id']] = row['name']

# Update JSON file
with open(json_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

for category in data:
    for item in category['items']:
        if item['id'] in mapping:
            item['id'] = mapping[item['id']]

with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("IDs replaced successfully!")