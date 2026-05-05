import pandas as pd
import json
import os

file_path = r'c:\Users\jan-k\Desktop\scraping\data_ab.xlsx'
staedte_path = r'c:\Users\jan-k\Desktop\scraping\staedte.xlsx'
output_path = r'c:\Users\jan-k\Desktop\scraping\frontend\src\data.json'

# ---------------------------------------------------------------------------
# Build population lookup from staedte.xlsx
# City name: col C (index 2), starting at row 3 (index 2)
# Population: col F (index 5), starting at row 3 (index 2)
# ---------------------------------------------------------------------------
import re
import unicodedata

population_lookup = {}        # key: normalised base name → population (int)
staedte_base_names: list[str] = []  # ordered list of all base names for fuzzy search

def _normalise(name: str) -> str:
    """Lower-case, handle German characters, strip punctuation, collapse whitespace."""
    if not name: return ""
    name = name.lower().strip()
    
    # Map German characters manually before any other normalization
    replacements = {
        'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss'
    }
    for char, rep in replacements.items():
        name = name.replace(char, rep)
        
    # Remove common ABH prefixes/noise
    noise = ['lra', 'stv', 'krv', 'abh', 'landkreis', 'kreis', 'stadt', 'gemeinde']
    tokens = name.split()
    tokens = [t for t in tokens if t not in noise]
    name = " ".join(tokens)

    # Standard ASCII normalization for any remaining accents
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    
    # Remove punctuation
    name = re.sub(r'[/\(\)\.\-,]', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name


if os.path.exists(staedte_path):
    df_st = pd.read_excel(staedte_path, header=None, engine='openpyxl')
    for _, row in df_st.iloc[2:].iterrows():          # skip rows 0-1 (title + header)
        raw_name = str(row.iloc[2]).strip()
        raw_pop  = row.iloc[5]

        if raw_name == 'nan' or pd.isna(raw_pop):
            continue

        # Strip suffixes like ", Stadt" / ", Landeshauptstadt" etc.
        base_name = raw_name.split(',')[0].strip()

        try:
            pop_val = int(float(raw_pop))
        except (ValueError, TypeError):
            continue

        norm = _normalise(base_name)
        if norm:
            population_lookup[norm] = pop_val
            staedte_base_names.append(norm)

    print(f"Loaded {len(population_lookup)} cities from staedte.xlsx")
else:
    print(f"WARNING: staedte.xlsx not found at {staedte_path}")


def _find_population(cleaned_name: str) -> int | None:
    """Multi-level fuzzy lookup for a city population."""
    key = _normalise(cleaned_name)
    if not key:
        return None

    # 1 ── Exact match
    if key in population_lookup:
        return population_lookup[key]

    # 2 ── Search for candidates where one contains the other
    candidates = [n for n in staedte_base_names if key in n or n in key]
    
    if not candidates:
        return None
        
    if len(candidates) == 1:
        return population_lookup[candidates[0]]
        
    # 3 ── If multiple candidates, pick the one with the best word overlap
    key_tokens = set(key.split())
    best_match = None
    max_overlap = -1
    
    for cand in candidates:
        cand_tokens = set(cand.split())
        overlap = len(key_tokens & cand_tokens)
        if overlap > max_overlap:
            max_overlap = overlap
            best_match = cand
        elif overlap == max_overlap:
            # If tie, pick the one closer in total length
            if abs(len(cand) - len(key)) < abs(len(best_match) - len(key)):
                best_match = cand
                
    return population_lookup[best_match] if best_match else None


def get_stadtgroesse(cleaned_name: str) -> str:
    """Return Klein / Mittel / Groß based on population from staedte.xlsx.
    Returns 'Unbekannt' if the city is not in staedte.xlsx."""
    if not cleaned_name or cleaned_name.lower() == 'nan':
        return "Unbekannt"

    pop = _find_population(cleaned_name)

    if pop is None:
        return "Unbekannt"
    if pop < 10_000:
        return "Klein"
    if pop <= 100_000:
        return "Mittel"
    return "Groß"


# ---------------------------------------------------------------------------
# Process data_ab.xlsx
# ---------------------------------------------------------------------------
if os.path.exists(file_path):
    df_raw = pd.read_excel(file_path, header=None, engine='openpyxl')

    header_row_idx = -1
    for idx, row in df_raw.iterrows():
        row_values = [str(v).strip() for v in row.values]
        if 'Nummer' in row_values and 'Name' in row_values:
            header_row_idx = idx
            break

    if header_row_idx == -1:
        header_row_idx = 0

    df = pd.read_excel(file_path, header=header_row_idx, engine='openpyxl')
    df.columns = [str(c).strip() for c in df.columns]

    data = []
    unmatched = []

    for i, row in df.iterrows():
        def get_val(name, pos):
            val = row.get(name)
            if pd.isna(val) or str(val).lower() == 'nan' or name.startswith('Unnamed'):
                try:
                    val = row.iloc[pos]
                except Exception:
                    val = ""
            if isinstance(val, str):
                return val.strip()
            return str(val).strip()

        name = get_val('Name', 2)
        if not name or name.lower() == 'nan' or name == 'Name':
            continue

        cleaned_name = get_val('Cleaned Name', 4)
        land = get_val('Land', 6)
        kontakt = get_val('Kontakt', 7)

        parts = []
        if cleaned_name and cleaned_name.lower() != 'nan':
            parts.append(cleaned_name)
        if land and land.lower() != 'nan':
            parts.append(land)

        address = ", ".join(parts)
        address = f"{address}, Germany" if address else "Germany"

        # Map Kontakt to Ja/Nein
        contacted = "Ja" if kontakt and kontakt.upper() == 'Y' else "Nein"

        # City size category
        stadtgroesse = get_stadtgroesse(cleaned_name)
        if stadtgroesse == "Unbekannt" and cleaned_name and cleaned_name.lower() != 'nan':
            unmatched.append(cleaned_name)

        data.append({
            "id": f"auth-{i}",
            "officeName": name,
            "phoneNumber": "N.N.",
            "emailAddress": "N.N.",
            "physicalAddress": address,
            "state": land if land and land.lower() != 'nan' else "Unbekannt",
            "contacted": contacted,
            "contactPerson": "N.N.",
            "stadtgroesse": stadtgroesse
        })

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Successfully converted {len(data)} records to {output_path}")

    # Summary breakdown
    from collections import Counter
    sizes = Counter(r["stadtgroesse"] for r in data)
    print(f"\nCity size breakdown:")
    for label in ["Klein", "Mittel", "Groß", "Unbekannt"]:
        print(f"  {label}: {sizes.get(label, 0)}")

    if unmatched:
        print(f"\nCities in data_ab not found in staedte.xlsx ({len(unmatched)}):")
        for c in sorted(set(unmatched)):
            print(f"  - {c}")
else:
    print(f"File not found: {file_path}")
