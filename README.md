# CppEmbed-AutoImport (QuickAdd Script)

Dieses Script wird **iterativ und bedarfsorientiert** weiterentwickelt.
Wer zufällig darüber stolpert: **bitte vollständig lesen**, da das Script einige **bewusst gesetzte strukturelle Voraussetzungen** hat und **nicht** als generischer „One-Click-Importer“ gedacht ist.

**CppEmbed-AutoImport** ist ein **QuickAdd-Macro-Script für Obsidian**, das automatisch eine **vollständige, strukturierte Code-Dokumentation** aus einem Projekt erzeugt.

Ursprünglich für **C++ / MFC / Visual Studio** entwickelt, unterstützt das Script inzwischen **mehrere Sprachen und Projektarten** und passt sein Verhalten **profilbasiert** an Projektstruktur, Dateitypen und Kontext an.

Das Script scannt einen **definiert eingegrenzten Projektordner (`Quellcode/`)** und erzeugt daraus strukturiertes Markdown mit:

* klarer Überschriftenhierarchie
* internen Obsidian-Links
* `embed-*`-Codeeinbettungen
  (optimiert für Lern-, Analyse- und Abgabe-Notizen)

---

## Grundprinzip (wichtig)

Das Script arbeitet **nicht im gesamten Vault**, sondern **ausschließlich innerhalb eines expliziten Projektcontainers**.

**Zwingende Voraussetzung:**

```text
<Projekt.md>
└── Quellcode/
    └── <echtes Projekt>
```

* `Quellcode/` ist **kein Projekt**, sondern ein **Container**
* das eigentliche Projekt liegt **innerhalb**
* das Script wird **aus der Markdown-Datei neben `Quellcode/` ausgeführt**
* dadurch ist die Rekursion **gezielt begrenzt und stabil**

Diese Architektur ist **bewusst gewählt** und kein Zufall.

---

## Neue & erweiterte Features (aktuelle Version)

### 🔁 Profilbasiertes Verhalten

Das Script arbeitet vollständig **profilgesteuert**.
Ein Profil definiert:

* relevante Ordner (`Source`, `Include`, `resources`, …)
* Code-Dateitypen
* Main-Dateien
* Konfigurationsdateien
* Asset- und Resource-Dateien

### Unterstützte Profile

| Profil       | Erkennung über Struktur / Dateien     |
| ------------ | ------------------------------------- |
| `cpp_mfc`    | `Source/`, `Include/`, `res/`, `x64/` |
| `java`       | `pom.xml`, `src/main/java`            |
| `javakotlin` | `src/main/kotlin`                     |
| `node`       | `package.json`, `vite.config.*`       |
| `csharp`     | `.csproj`, `Program.cs`               |
| `python`     | `pyproject.toml`, `requirements.txt`  |
| `lua`        | `fxmanifest.lua`, `.lua`              |
| `php`        | `composer.json`, `index.php`          |

### Profilermittlung

Das aktive Profil wird bestimmt über:

1. **Language-Tag im Markdown** (falls vorhanden)
2. **Projektstruktur innerhalb von `Quellcode/`**
3. **Fallback:** `cpp_mfc`

---

## Intelligente Projekt- & Root-Erkennung

* **Strikte Begrenzung auf `Quellcode/`**
* **Zusätzliche Projekt-Root-Erkennung innerhalb von `Quellcode/`**

  * z. B. bei:

    ```text
    Quellcode/
    └── SpaceShooter/
        ├── SpaceShooter.csproj
        └── Program.cs
    ```
* Segmentweise, **case-insensitive Ordnerauflösung**

  * `Source`, `source`, `SOURCE` → gültig
* **Kein hartes `path.join`**
* stabil auf **Windows, macOS, Linux**

---

## Saubere Abschnittslogik

Automatisch erzeugte Hauptabschnitte (profilabhängig):

```text
# Erarbeitete Lösung
## Main
## Include
## Source
## Resources
## Config
## Container
## Assets
## Debug / Release (C++)
```

Nicht relevante Dateien werden **bewusst gesammelt** unter:

```text
## Weitere Dateien
```

Keine Vermischung von Code, Assets und Build-Artefakten.

---

## Ressourcen & Assets (neu & erweitert)

### C++ / MFC

* `.rc`, `.rc2` → **Resources**
* `.ico`, `.bmp` → **Assets** (als Bildvorschau)
* saubere Trennung von:

  * Code
  * Ressourcen
  * Binärdateien

### Node / Frontend

* Bilder (`.png`, `.svg`, `.jpg`, …) → **Assets**
* **keine** Einbettung von Binärdateien als Code

---

## Config-Dateien (profilübergreifend)

Konfigurationsdateien werden **profilunabhängig erkannt** und gesammelt unter:

```text
## Config
```

Beispiele:

* `CMakeLists.txt`
* `.editorconfig`
* `pom.xml`
* `application.yml`
* `package.json`
* `vite.config.ts`
* `.csproj`
* `pyproject.toml`

---

## Container-Sektion (neu)

Dateien mit Infrastruktur-Bezug werden **separat dokumentiert**:

```text
## Container
```

Erkannt werden u. a.:

* `Dockerfile`
* `docker-compose.yml`
* `compose.yaml`
* `nginx.conf`
* `.env`

Diese Dateien werden **embedded**, nicht nur verlinkt.

---

## Erwartete Projektstruktur (Beispiel: C++ / MFC)

```text
Quellcode/
├── Include/
│   └── ProjectName/
├── Source/
│   └── ProjectName/
│       └── main.cpp
├── res/
│   ├── *.rc
│   └── *.ico
├── x64/
│   ├── Debug/
│   └── Release/
```

Der Projektname wird **automatisch erkannt**
(erstes Unterverzeichnis von `Source/` oder `Include/`).

---

## Verwendung

### Voraussetzungen

* Obsidian (Desktop)
* **QuickAdd Plugin**
* **Embed Code File Plugin**
  (`embed-cpp`, `embed-java`, `embed-js`, `embed-py`, …)

---

### Einrichtung in QuickAdd

1. **QuickAdd → Macros → New Macro**
2. JavaScript-Datei auswählen:

   ```text
   CppEmbed-AutoImport.js
   ```
3. Macro z. B. nennen:
   **„Codebasis importieren“**
4. Optional Shortcut vergeben

---

### Ausführung

1. Markdown-Datei neben `Quellcode/` öffnen
2. Cursor an gewünschte Stelle setzen
3. QuickAdd-Macro ausführen

👉 Die Selektion wird ersetzt durch eine **vollständige Projektdokumentation**.

---

## Zentrale Konfiguration (im Script)

```js
const ROOT_DIR_NAME = "Quellcode";
const MAX_HEADING_LEVEL = 6;
```

Alle weiteren Regeln sind **profilgesteuert** über:

```js
const PROJECT_PROFILES = { ... }
```

---

## Technische Details

* Reines **QuickAdd-JavaScript**
* **kein eigenes Obsidian-Plugin**
* Zugriff über Node (`fs`, `path`)
* POSIX-Pfadnormalisierung
* keine globalen Seiteneffekte
* deterministische Ausgabe
* bewusst keine UI-Konfiguration
  → Versionierbarkeit & Reproduzierbarkeit

---

## Bekannte Einschränkungen

* Nur **Desktop**
* reales Dateisystem erforderlich
* `embed-*` Plugins müssen installiert sein
* kein GUI-Setup (bewusst)
* Script erwartet **strukturierte Projekte**, kein Chaos-Import

---

## Autor

**Elodin**


