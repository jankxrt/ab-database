import pandas as pd
import requests
import re
import time

# --- CONFIGURATION ---
FILE_PATH = "data_abss.xlsx"
HEADER_ROW = 1 
COLUMNS_RANGE = "B:F"

def direct_scrape_email(city_name):
    if not isinstance(city_name, str) or pd.isna(city_name):
        return ""
    
    url_name = (city_name.lower().strip()
                .replace(' ', '-').replace('ü', 'ue').replace('ä', 'ae')
                .replace('ö', 'oe').replace('ß', 'ss').replace('/', '-')
                .replace('--', '-'))
    
    url = f"https://www.{url_name}.de/impressum"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    try:
        print(f"Checking: {url}")
        response = requests.get(url, headers=headers, timeout=8)
        if response.status_code == 200:
            emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', response.text)
            if emails:
                return list(set(emails))[0]
    except:
        return "Connection Failed"
    return "No Email Found"

# --- MAIN EXECUTION ---
try:
    df = pd.read_excel(FILE_PATH, header=HEADER_ROW, usecols=COLUMNS_RANGE)
    df.columns = df.columns.str.strip()
    df = df.dropna(subset=['Cleaned Name'])

    # --- THE FIX FOR YOUR ERROR ---
    # This ensures the 'Result' column is ready for text, not numbers
    df['Result'] = "" # Initialize as empty strings
    df['Result'] = df['Result'].astype(str)

    print(f"Loaded {len(df)} rows. Starting scrape...")

    for index, row in df.iterrows():
        email_result = direct_scrape_email(row['Cleaned Name'])
        df.at[index, 'Result'] = str(email_result) # Force result to string
        
        # Every 10 rows, save a backup so you don't lose progress
        if index % 10 == 0:
            df.to_excel("Scraping_Backup.xlsx", index=False)
        
        time.sleep(0.5) 

    df.to_excel("Final_Scraped_Results.xlsx", index=False)
    print("\n--- Done! Check Final_Scraped_Results.xlsx ---")

except Exception as e:
    print(f"An unexpected error occurred: {e}")