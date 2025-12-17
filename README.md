#  CppEmbed-AutoImport (QuickAdd Script)

Ein **QuickAdd-Macro-Script für Obsidian**, das automatisch eine vollständige, strukturierte **C++-Code-Dokumentation** aus einem Projektordner erzeugt.

Das Script scannt einen definierten `Quellcode/`-Ordner und erzeugt Markdown mit:

* Überschriftenhierarchie
* internen Links
* `embed-cpp`-Code-Einbettungen
  ideal für Lern-, Analyse- und Abgabe-Notizen.

---

##  Features

*  Automatische Projekterkennung (`Include/`, `Source/`, `Test/`, `res/`, `x64/`)
*  Robuste Case-Insensitive-Ordnersuche
*  Sonderbehandlung für `Main.cpp`
*  Rekursive Baumstruktur mit Headings
*  Kompatibel mit **Embed Code File** (` ```embed-cpp `)
*  Funktioniert **relativ zur aktiven Markdown-Datei**
*  Keine Abhängigkeit von Plugin-APIs außer QuickAdd

---

##  Erwartete Projektstruktur

```text
Quellcode/
├── Include/
│   └── ProjectName/
├── Source/
│   └── ProjectName/
│       └── main.cpp
├── Test/
├── res/
└── x64/
```

> Der Projektname wird **automatisch erkannt** (erstes Unterverzeichnis).

---

##  Verwendung

###  Voraussetzungen

* Obsidian
* **QuickAdd Plugin**
* **Embed Code File Plugin**

---

### 2️ Einrichtung in QuickAdd

1. **QuickAdd → Macros → New Macro**
2. JavaScript-File auswählen:

   ```text
   CppEmbed-AutoImport.js
   ```
3. Macro z. B. nennen:
   **„C++ Quellcode importieren“**
4. Optional Shortcut vergeben

---

### 3️ Ausführung

* Markdown-Datei öffnen
* Cursor an gewünschte Stelle setzen
* QuickAdd-Macro ausführen

 Das Script erzeugt automatisch:

* `# Erarbeitete Lösung`
* `## Main.cpp`
* strukturierte Abschnitte für:

  * Quellcode
  * Include
  * Source
  * Ressourcen
  * Release/Debug
  * Tests

---

##  Konfiguration (im Script)

```js
const ROOT_DIR_NAME = "Quellcode";
const INCLUDE_NAME = "Include";
const SOURCE_NAME  = "Source";
const TEST_NAME    = "Test";
const RESSOURCES_NAME = "res";
const X64_Name     = "x64";
```

### Unterstützte Dateitypen

```text
.cpp .h .hpp .c .rc .bmp .ico .sln .vcxproj .pdb .obj …
```

---

##  Technische Hinweise

* **Kein Obsidian-Plugin** → kein `manifest.json`
* Zugriff auf Dateisystem via Node (`fs`, `path`)
* Pfade werden **POSIX-normalisiert**
* Heading-Tiefe begrenzt (`MAX_HEADING_LEVEL = 7`)
* Doppelte Headings werden sauber vermieden

---

##  Bekannte Einschränkungen

* Funktioniert nur auf **Desktop**
* Erwartet reale Dateien (kein Sandbox-FS)
* `embed-cpp` muss separat installiert sein
* Keine UI-Konfiguration (bewusst)

---


## 👤 Autor

**Elodin**

---

