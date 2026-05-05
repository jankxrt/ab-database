import pandas as pd
import os

file_path = r'c:\Users\jan-k\Desktop\scraping\data_abss.xlsx'

if os.path.exists(file_path):
    # Read the file starting from row 1 (the header row)
    df = pd.read_excel(file_path, skiprows=1)
    print("Columns:", df.columns.tolist())
    print("Non-null results count:", df['Result'].notnull().sum())
    print("\nFirst 10 rows with results:")
    print(df[df['Result'].notnull()].head(10).to_string())
else:
    print(f"File not found: {file_path}")
