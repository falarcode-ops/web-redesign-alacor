import os
import json
import shutil
import re

SOURCE_DIR = r"C:\Users\Acer\Google Drive\ALACOR COMPANY\COMERCIAL\TIENDA VIRTUAL\IMAGENES PRODUCTOS"
DEST_DIR = r"c:\Users\Acer\Documents\Mis Documetos\Developer\AI\web-redesign-alacor\img\catalogo"
CATALOG_FILE = r"c:\Users\Acer\Documents\Mis Documetos\Developer\AI\web-redesign-alacor\catalogo.json"

if not os.path.exists(DEST_DIR):
    os.makedirs(DEST_DIR)

categories = {
    "Protección Cabeza": ["casco", "tafilete", "barbuquejo"],
    "Protección Visual y Facial": ["lente", "careta", "visor", "monogafa", "gafa"],
    "Protección Auditiva": ["fono", "tapa oido", "tapa oídos", "tapón auditivo"],
    "Protección Respiratoria": ["respirador", "filtro", "cartucho"],
    "Protección Manual": ["guante", "manga"],
    "Calzado de Seguridad": ["bota", "zapato", "zapatilla", "tenis", "zapatón"],
    "Trabajo en Alturas": ["arnes", "arnés", "eslinga", "cuerda", "ascendedor", "descendedor", "polea", "mosqueton", "mosquetón", "linea de vida", "línea de vida", "tie-off", "anclaje"],
    "Dotación y Ropa de Trabajo": ["impermeable", "camisa", "pantalon", "pantalón", "overol", "chaleco", "peto", "polaina", "capuchon", "chaqueta"],
    "Señalización y Bloqueo (LOTO)": ["candado", "bloqueo", "bloqueador", "tarjeta", "señal", "cono", "barrera", "hito"],
    "Emergencias y Control de Derrames": ["botiquin", "botiquín", "absorbente", "camilla", "derrames", "termometro", "lavaojos"]
}

catalog = {cat: [] for cat in categories.keys()}
catalog["Otros"] = []

def classify_item(name):
    name_lower = name.lower()
    for cat, keywords in categories.items():
        if any(kw in name_lower for kw in keywords):
            return cat
    return "Otros"

items_processed = 0

for root, dirs, files in os.walk(SOURCE_DIR):
    for name in files + dirs:
        if name.endswith('.ini'): continue
        
        cat = classify_item(name)
        item_data = {
            "nombre_original": name,
            "tipo": "archivo" if name in files else "directorio",
            "ruta_relativa": os.path.relpath(os.path.join(root, name), SOURCE_DIR)
        }
        catalog[cat].append(item_data)
        items_processed += 1
        
        # Copiar una imagen representativa por categoría (solo si es archivo de imagen)
        if name in files and name.lower().endswith(('.png', '.jpg', '.jpeg')):
            safe_name = re.sub(r'[^a-zA-Z0-9_\.]', '_', name)
            cat_safe = re.sub(r'[^a-zA-Z0-9]', '_', cat)
            dest_file = os.path.join(DEST_DIR, f"{cat_safe}_rep_{safe_name}")
            
            # Solo copiamos hasta 3 representativas por categoría para no llenar el disco
            existing_reps = [f for f in os.listdir(DEST_DIR) if f.startswith(cat_safe)]
            if len(existing_reps) < 3:
                try:
                    shutil.copy2(os.path.join(root, name), dest_file)
                except Exception as e:
                    pass

with open(CATALOG_FILE, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=4, ensure_ascii=False)

print(f"Catalogación completada. {items_processed} items clasificados.")
