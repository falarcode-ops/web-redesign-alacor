import os
import json
import shutil
import hashlib

SOURCE_DIR = r"C:\Users\Acer\Google Drive\ALACOR COMPANY\MARKETING"
DEST_DIR = r"c:\Users\Acer\Documents\Mis Documetos\Developer\AI\web-redesign-alacor\img\marketing"
JSON_FILE = r"c:\Users\Acer\Documents\Mis Documetos\Developer\AI\web-redesign-alacor\marketing_assets.json"

if not os.path.exists(DEST_DIR):
    os.makedirs(DEST_DIR)

# Estructura del catálogo lógico
catalog = {
    "Logos Oficiales": [],
    "Banners y Campañas": [],
    "Logos Aliados": [],
    "Recursos Generales": [],
    "Duplicados Eliminados (Logicamente)": []
}

hash_dict = {}
duplicates_count = 0
processed_count = 0

def get_file_hash(filepath):
    hasher = hashlib.md5()
    try:
        with open(filepath, 'rb') as afile:
            buf = afile.read(65536)
            while len(buf) > 0:
                hasher.update(buf)
                buf = afile.read(65536)
        return hasher.hexdigest()
    except:
        return None

valid_extensions = ('.png', '.jpg', '.jpeg', '.svg', '.webp', '.mp4', '.gif')

logo_found = False
hero_found = False

for root, dirs, files in os.walk(SOURCE_DIR):
    for name in files:
        if not name.lower().endswith(valid_extensions):
            continue
            
        filepath = os.path.join(root, name)
        file_hash = get_file_hash(filepath)
        
        if not file_hash: continue
        
        rel_path = os.path.relpath(filepath, SOURCE_DIR)
        
        if file_hash in hash_dict:
            # Es un duplicado exacto
            catalog["Duplicados Eliminados (Logicamente)"].append({
                "nombre": name,
                "ruta": rel_path,
                "original": hash_dict[file_hash]
            })
            duplicates_count += 1
            continue
            
        hash_dict[file_hash] = rel_path
        processed_count += 1
        
        # Lógica de clasificación
        root_lower = root.lower()
        name_lower = name.lower()
        
        item_data = {"nombre": name, "ruta": rel_path}
        
        category = "Recursos Generales"
        if "manual de marca" in root_lower or "logo" in name_lower or "firmas" in root_lower:
            category = "Logos Oficiales"
            # Extraer logo para la UI
            if not logo_found and ("png" in name_lower or "svg" in name_lower):
                try:
                    shutil.copy2(filepath, os.path.join(DEST_DIR, "logo_alacor_oficial" + os.path.splitext(name)[1]))
                    logo_found = True
                except: pass
                
        elif "campaña" in root_lower or "banner" in name_lower or "tienda virtual" in root_lower:
            category = "Banners y Campañas"
            # Extraer banner para la UI
            if not hero_found and ("jpg" in name_lower or "png" in name_lower):
                try:
                    shutil.copy2(filepath, os.path.join(DEST_DIR, "hero_banner" + os.path.splitext(name)[1]))
                    hero_found = True
                except: pass
                
        elif "aliandos" in root_lower:
            category = "Logos Aliados"
            
        catalog[category].append(item_data)

with open(JSON_FILE, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=4, ensure_ascii=False)

print(f"Marketing Audit completado: {processed_count} recursos únicos identificados.")
print(f"Se identificaron y filtraron {duplicates_count} imágenes repetidas.")
if logo_found: print("Logo oficial extraído y copiado al proyecto web.")
if hero_found: print("Banner promocional extraído y copiado al proyecto web.")
