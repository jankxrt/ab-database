import pandas as pd
import os

file_path = r'c:\Users\jan-k\Desktop\scraping\Scraping_Backup.xlsx'

if os.path.exists(file_path):
    df = pd.read_excel(file_path)
    print("Columns:", df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head(5).to_string())
else:
    print(f"File not found: {file_path}")
