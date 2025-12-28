///  QuickAdd Script: CppEmbed-Flow
// Ablauf:
// 2) "# Erarbeitete Lösung"
// 3) Source: Main.cpp
// 4) Include (ohne ProjectName)
// 5) Source (ohne ProjectName & ohne Main.cpp)
// Kompatibel mit "Embed Code File" (```embed-cpp)





const PROJECT_PROFILES = {
  cpp_mfc: {
    roots: {
      source: ["Source"],
      include: ["Include"],
      resources: ["res"],
      build: ["x64"]
    },
    codeExtensions: [".cpp", ".h", ".hpp", ".c", ".cc"],
    resourceExtensions: [".rc", ".rc2"],
    assetExtensions: [".ico", ".bmp"],
    mainFiles: ["main.cpp"],
    buildModes: ["Debug", "Release"],
    configFiles: [
      "CMakeLists.txt",
      ".editorconfig"
    ]
  },
  javakotlin: {
    roots: {
      source: ["src/main/java", "src/main/kotlin"],
      test: ["src/test/java", "src/test/kotlin"],
      resources: ["src/main/resources"]
    },
    codeExtensions: [".java", ".kt"],
    mainFiles: ["Application.java", "Main.java"],
    configFiles: [
      "pom.xml",
      "build.gradle",
      "build.gradle.kts",
      "application.yml"
    ]
  },

  java: {
    roots: {
      source: ["src/main/java"],
      test: ["src/test/java"],
      resources: ["src/main/resources"]
    },
    codeExtensions: [".java"],
    mainFiles: ["Application.java", "Main.java"],
    configFiles: [
      "pom.xml",
      "application.yml",
      "application.properties"
    ]
  },

  node: {
    roots: {
      source: ["src"],
      public: ["public"],
      config: ["."]
    },
    codeExtensions: [
      ".js", ".ts",
      ".jsx", ".tsx",
      ".css", ".scss"
    ],
    assetExtensions: [
      ".svg", ".png", ".jpg", ".jpeg", ".webp"
    ],
    configFiles: [
      "vite.config.js",
      "vite.config.ts",
      "package.json",
      "dockerfile",
      "docker-compose.yml",
      ".env"
    ],autoSections: [
      "pages",
      "components",
      "api",
      "security",
      "services",
      "hooks",
      "layouts"
    ],
    mainFiles: ["main.jsx", "main.tsx", "index.js"]
  },
  csharp: {
    roots: {
      source: ["src", "."],
      test: ["tests"],
      resources: ["Resources", "Properties"]
    },
    codeExtensions: [".cs"],
    mainFiles: ["Program.cs"],
    configFiles: [
      ".csproj",
      "appsettings.json",
      "appsettings.Development.json"
    ]
  },
  python: {
    roots: {
      source: ["src", "."],
      test: ["tests"]
    },
    codeExtensions: [".py"],
    mainFiles: ["main.py", "__main__.py"],
    configFiles: [
      "requirements.txt",
      "pyproject.toml",
      "setup.py"
    ]
  },
  lua: {
    roots: {
      source: ["src", "."]
    },
    codeExtensions: [".lua"],
    mainFiles: ["main.lua"],
    configFiles: [
      "fxmanifest.lua",
      "__resource.lua"
    ]
  },
  php: {
    roots: {
      source: ["src", "app"],
      public: ["public"],
      resources: ["resources"]
    },
    codeExtensions: [".php"],
    mainFiles: ["index.php"],
    configFiles: [
      "composer.json",
      ".env"
    ]
  }





};

const LANGUAGE_TO_PROFILE = {
  cpp: "cpp_mfc",
  cplusplus: "cpp_mfc",

  java: "java",
  kotlin: "javakotlin",
  javakotlin: "javakotlin",

  js: "node",
  javascript: "node",
  node: "node",
  nodejs: "node",
  jsx: "node",
  tsx: "node",
  csharp: "csharp",
  cs: "csharp",

  python: "python",
  py: "python",

  lua: "lua",

  php: "php"
};

const fs = require("fs");
const path = require("path");
// =========================
// CODEBLOCK A: Engine/Helper
// =========================
const exists = (p) => { try { return fs.existsSync(p); } catch { return false; } };
const listDir = (p) => fs.readdirSync(p, { withFileTypes: true });
const toPosix = (p) => p.replace(/\\/g, "/");

// Root-Resolver (streng, ohne case-insensitive segments)
const resolveRoot = (baseAbs, relPath) => {
  if (!baseAbs || !relPath) return null;
  const segments = relPath.split("/").filter(Boolean);
  let current = baseAbs;
  for (const seg of segments) {
    if (!exists(current)) return null;
    const hit = listDir(current).find(
        d => d.isDirectory() && d.name.toLowerCase() === seg.toLowerCase()
    );
    if (!hit) return null;
    current = toPosix(path.join(current, hit.name));
  }
  return exists(current) ? current : null;
};
const collectResourceFiles = (root) => {
  if (!root || !exists(root)) return [];
  const out = [];

  const walk = (dir) => {
    for (const de of listDir(dir)) {
      const abs = toPosix(path.join(dir, de.name));
      if (de.isDirectory()) walk(abs);
      else out.push(abs);
    }
  };

  walk(root);
  return out;
};

// Collect: alle Dateien (für "Weitere Dateien")
const collectAllFiles = (root) => {
  if (!root || !exists(root)) return [];
  const out = [];
  const walk = (dir) => {
    for (const de of listDir(dir)) {
      const abs = toPosix(path.join(dir, de.name));
      if (de.isDirectory()) walk(abs);
      else out.push(abs);
    }
  };
  walk(root);
  out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return out;
};

const groupFilesByTopFolder = (files, root) => {
  const groups = {};
  for (const abs of files) {
    const rel = toPosix(path.relative(root, abs));
    if (!rel || rel.startsWith("..")) continue;

    const [top] = rel.split("/");
    if (!top) continue;

    groups[top] ??= [];
    groups[top].push(abs);
  }
  return groups;
};

// Main-Datei-Section (profilabhängig)
const buildMainSection = (files, profile, embedLang, toVaultRel) => {
  const mainCandidates = PROJECT_PROFILES[profile].mainFiles?.map(f => f.toLowerCase()) ?? [];
  if (mainCandidates.length === 0) return "";

  const mainAbs = files.find(f => mainCandidates.includes(path.basename(f).toLowerCase()));
  if (!mainAbs) return "";

  const mainRelVault = toVaultRel(mainAbs);
  const title = path.basename(mainAbs);

  let s = `## ${title}\n`;
  s += `[[${mainRelVault}|Main]]\n`;
  s += `\`\`\`embed-${embedLang}\n`;
  s += `PATH: "vault://${mainRelVault}"\n`;
  s += `TITLE: "${title}"\n`;
  s += "```\n\n";
  return s;
};

// Tree-Builder (Ordnerstruktur -> Headings + Embeds)
const buildTree = (
    sectionTitle,
    files,
    root,
    skipFirstFolderName,
    excludeNamesSet,
    embedLang,
    toVaultRel,
    maxHeadingLevel
) => {
  if (!files?.length) return "";
  if (!root || !exists(root)) return "";

  let s = `\n## ${sectionTitle}\n\n`;
  const printedHeadings = new Set();

  for (const abs of files) {
    const relToRoot = toPosix(path.relative(root, abs));
    if (!relToRoot || relToRoot.split("/")[0] === "..") continue;

    const partsOrig = relToRoot.split("/").filter(p => p && p !== ".");
    let parts = partsOrig.slice();

    if (
        skipFirstFolderName &&
        parts.length > 1 &&
        parts[0].toLowerCase() === skipFirstFolderName.toLowerCase()
    ) {
      parts = parts.slice(1);
    }

    if (parts.length === 0) continue;

    const fileName = parts[parts.length - 1];
    if (excludeNamesSet && excludeNamesSet.has(fileName.toLowerCase())) continue;

    for (let i = 0; i < parts.length - 1; i++) {
      const key = `${sectionTitle}:${parts.slice(0, i + 1).join("/")}`;
      if (printedHeadings.has(key)) continue;
      printedHeadings.add(key);

      const level = Math.min(3 + i, maxHeadingLevel);
      s += `${"#".repeat(level)} ${parts[i]}\n`;
    }

    const level = Math.min(3 + parts.length, maxHeadingLevel);
    s += `${"#".repeat(level)} ${fileName}\n`;
    s += `[[${toVaultRel(abs)}|${fileName}]]\n`;
    s += `\`\`\`embed-${embedLang}\n`;
    s += `PATH: "vault://${toVaultRel(abs)}"\n`;
    s += `TITLE: "${fileName}"\n`;
    s += "```\n\n";
  }

  return s;
};

// CPP: Exe-Links aus x64/Debug & x64/Release
const buildExeLinksFromX64 = (x64Root, toVaultRel) => {
  if (!x64Root || !exists(x64Root)) return "";

  const entries = listDir(x64Root).filter(d => d.isDirectory());

  const collectExeLinks = (subDirName) => {
    const dir = entries.find(d => d.name.toLowerCase() === subDirName);
    if (!dir) return [];
    const absDir = toPosix(path.join(x64Root, dir.name));
    return listDir(absDir)
        .filter(f => f.isFile() && f.name.toLowerCase().endsWith(".exe"))
        .map(f => toPosix(path.join(absDir, f.name)));
  };

  const debugExes = collectExeLinks("debug");
  const releaseExes = collectExeLinks("release");

  let s = "";

  if (debugExes.length > 0) {
    s += "## Debug\n\n";
    for (const exe of debugExes) {
      const fileName = path.basename(exe);
      s += `[[${toVaultRel(exe)}|${fileName}]]\n`;
    }
    s += "\n";
  }

  if (releaseExes.length > 0) {
    s += "## Release\n\n";
    for (const exe of releaseExes) {
      const fileName = path.basename(exe);
      s += `[[${toVaultRel(exe)}|${fileName}]]\n`;
    }
    s += "\n";
  }

  return s;
};

const isAssetFile = (name) =>
    Object.values(PROJECT_PROFILES)
        .flatMap(p => p.assetExtensions ?? [])
        .some(ext => name.toLowerCase().endsWith(ext));


const findViteProjectRoot = (startDir, maxDepth = 5) => {
  const walk = (dir, depth) => {
    if (depth > maxDepth) return null;
    if (!exists(dir)) return null;

    const entries = listDir(dir);

    // Treffer?
    if (entries.some(e =>
        e.isFile() &&
        e.name.toLowerCase().startsWith("vite.config.")
    )) {
      return dir;
    }

    // Rekursiv in Unterordner
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith(".")) continue;
      if (["node_modules", "dist", "build"].includes(e.name)) continue;

      const hit = walk(
          toPosix(path.join(dir, e.name)),
          depth + 1
      );
      if (hit) return hit;
    }

    return null;
  };

  return walk(startDir, 0);
};

// -------------------- Konfiguration --------------------
const ROOT_DIR_NAME = "Quellcode";        // Ordner mit Include/Source
const MAX_HEADING_LEVEL = 6;              // maximale Heading-Tiefe (### ... ######)

// ------------------------------------------------------

module.exports = async (params) => {
  const app = params.app;
  const editor = app.workspace.activeEditor?.editor;
  if (!editor) return;

  const activeFile = app.workspace.getActiveFile();
  if (!activeFile) {
    new Notice("Keine aktive Datei.");
    return;
  }
  const content = editor.getValue();


  const langMatch = content.match(/Language:\s*"\[\[(.*?)\]\]"/);

  const normalizeLanguage = (s) =>
      s?.toLowerCase().replace(/[^a-z]/g, "");

  const languageTagRaw = langMatch ? langMatch[1] : null;
  const languageKey = normalizeLanguage(languageTagRaw);

  const detectProfileByStructure = (qcRoot) => {
    if (!qcRoot) return null;

    // ---------- C# ----------
    if (
        exists(path.join(qcRoot, "Program.cs")) ||
        listDir(qcRoot).some(f =>
            f.isFile() && f.name.toLowerCase().endsWith(".csproj")
        )    ) {
      return "csharp";
    }

    // ---------- Lua ----------
    if (
        exists(path.join(qcRoot, "fxmanifest.lua")) ||
        listDir(qcRoot).some(f => f.name.endsWith(".lua"))
    ) {
      return "lua";
    }

    // ---------- PHP ----------
    if (
        exists(path.join(qcRoot, "composer.json")) ||
        exists(path.join(qcRoot, "index.php"))
    ) {
      return "php";
    }

    // ---------- Python ----------
    if (
        exists(path.join(qcRoot, "pyproject.toml")) ||
        exists(path.join(qcRoot, "requirements.txt"))
    ) {
      return "python";
    }

    // ---------- Node ----------
    if (
        exists(path.join(qcRoot, "package.json")) ||
        exists(path.join(qcRoot, "vite.config.js")) ||
        exists(path.join(qcRoot, "vite.config.ts"))
    ) {
      return "node";
    }

    // ---------- Java ----------
    if (
        exists(path.join(qcRoot, "pom.xml")) ||
        exists(path.join(qcRoot, "src/main/java"))
    ) {
      return "java";
    }

    // ---------- Kotlin ----------
    if (exists(path.join(qcRoot, "src/main/kotlin"))) {
      return "javakotlin";
    }

    // ---------- C++ ----------
    if (
        exists(path.join(qcRoot, "Source")) ||
        exists(path.join(qcRoot, "Include"))
    ) {
      return "cpp_mfc";
    }

    return null;
  };


  const vaultRoot = app.vault.adapter.basePath.replace(/\\/g, "/");
  const currentDir = path.dirname(`${vaultRoot}/${activeFile.path}`).replace(/\\/g, "/");
  const toVaultRel = (abs) =>
      toPosix(path.relative(vaultRoot, abs));

  // Hilfsfunktionen
  const collectConfigFiles = (root, configFileNames) => {
    if (!root || !exists(root)) return [];
    return listDir(root)
        .filter(f =>
            f.isFile() &&
            configFileNames.includes(f.name.toLowerCase())
        )
        .map(f => toPosix(path.join(root, f.name)));
  };

  const detectProjectRoot = (qcRoot) => {
    if (!qcRoot || !exists(qcRoot)) return null;

    // 1) Direkt prüfen (flacher Fall)
    const directHit = listDir(qcRoot).some(f =>
            f.isFile() && (
                f.name.endsWith(".csproj") ||
                f.name === "Program.cs"
            )
    );
    if (directHit) return qcRoot;

    // 2) Genau eine Ebene tiefer
    for (const d of listDir(qcRoot)) {
      if (!d.isDirectory()) continue;

      const sub = path.join(qcRoot, d.name);
      const hit = listDir(sub).some(f =>
              f.isFile() && (
                  f.name.endsWith(".csproj") ||
                  f.name === "Program.cs"
              )
      );
      if (hit) return sub;
    }

    return qcRoot; // Fallback
  };

  // finde Quellcode-Root relativ zur aktiven Datei
  // 1) qcRoot bestimmen
  const qcRoot = [ROOT_DIR_NAME, ROOT_DIR_NAME.toLowerCase(), ROOT_DIR_NAME.toUpperCase()]
      .map(n => toPosix(path.join(currentDir, n)))
      .find(exists);

  if (!qcRoot) {
    new Notice(`Ordner '${ROOT_DIR_NAME}' nicht gefunden.`);
    return;
  }





// 2) Profil bestimmen
  const profileFromLanguage =
      LANGUAGE_TO_PROFILE[languageKey] ?? null;

  const projectRoot =
      detectProjectRoot(qcRoot);

  const profileFromStructure =
      detectProfileByStructure(projectRoot);

  new Notice(
      `qcRoot=${qcRoot}\nprojectRoot=${projectRoot}`
  );




  const ACTIVE_PROFILE =
      profileFromLanguage
      ?? profileFromStructure
      ?? "cpp_mfc";

  const profileConfigFiles =
      PROJECT_PROFILES[ACTIVE_PROFILE].configFiles ?? [];

  const configFiles = collectConfigFiles(
      qcRoot,
      profileConfigFiles.map(f => f.toLowerCase())
  );

  const CODE_EXTS = PROJECT_PROFILES[ACTIVE_PROFILE].codeExtensions;

  const isCodeFile = name =>
      CODE_EXTS.some(ext => name.toLowerCase().endsWith(ext));




  const isFrontendCodeFile = (name) =>
      ACTIVE_PROFILE !== "node" &&
      PROJECT_PROFILES.node.codeExtensions
          ?.some(ext => name.toLowerCase().endsWith(ext));

// Non-Code-Dateien (nur Links, ohne Ordneranzeige)


  const isContainerFile = (name) => {
    const n = name.toLowerCase();
    return (
        n === "dockerfile" ||
        n.startsWith("docker-compose") ||
        n === "compose.yaml" ||
        n.endsWith(".env") ||
        n.includes("nginx")
    );
  };




  const buildNonCodeLinksAtBottom = (files, toVaultRel) => {
    if (!files.length) return "";

    let s = "\n## Weitere Dateien\n\n";
    for (const abs of files) {
      s += `[[${toVaultRel(abs)}|${path.basename(abs)}]]\n`;
    }
    return s + "\n";
  };


  const collectFrontendFiles = (root) => {
    if (!root || !exists(root)) return [];
    const out = [];
    const walk = (dir) => {
      for (const de of listDir(dir)) {
        const abs = toPosix(path.join(dir, de.name));
        if (de.isDirectory()) walk(abs);
        else if (isFrontendCodeFile(de.name)) out.push(abs);
      }
    };
    walk(root);
    return out;
  };

  const profileRoots = PROJECT_PROFILES[ACTIVE_PROFILE].roots;

  const includeRoot = profileRoots.include?.map(r => resolveRoot(qcRoot, r)).find(Boolean);

  let sourceRoots =
      profileRoots.source
          ?.map(r => resolveRoot(qcRoot, r))
          .filter(Boolean) ?? [];

  if (
      ACTIVE_PROFILE === "node" &&
      sourceRoots.length === 0
  ) {
    const viteRoot = findViteProjectRoot(qcRoot);
    if (viteRoot) {
      const viteSrc = resolveRoot(viteRoot, "src");
      if (viteSrc) {
        sourceRoots = [viteSrc];
        new Notice("ℹ️ Vite-Projekt automatisch erkannt");
      }
    }
  }

  const testRoot = profileRoots.test?.map(r => resolveRoot(qcRoot, r)).find(Boolean);
  const resourceRoot = profileRoots.resources?.map(r => resolveRoot(qcRoot, r)).find(Boolean);
  const x64Root = profileRoots.build?.map(r => resolveRoot(qcRoot, r)).find(Boolean);


  // Projektname = erster Unterordner in Include bzw. Source (symmetrisch ermitteln)
  const detectProjectName = root => {
    if (!root || !exists(root)) return null;
    const first = listDir(root).find(d => d.isDirectory()); // erster Ordner
    return first ? first.name : null;
  };
  const includeProject = detectProjectName(includeRoot);
  const sourceProject = detectProjectName(sourceRoots[0]);
  const testProject = detectProjectName(testRoot);
  const resourceProject = detectProjectName(resourceRoot);
  const x64Project = detectProjectName(x64Root);


  const projectName = sourceProject || includeProject || testProject || resourceProject || x64Project || null;


  const detectAllProjects = (qcRoot) => {
    if (!qcRoot || !exists(qcRoot)) return [];

    return listDir(qcRoot)
        .filter(d => d.isDirectory())
        .map(d => ({
          name: d.name,
          root: toPosix(path.join(qcRoot, d.name))
        }))
        .filter(p =>
            exists(path.join(p.root, "Source")) ||
            exists(path.join(p.root, "Include"))
        );
  };


  const detectedProjects = detectAllProjects(qcRoot);

  const IS_MULTI_PROJECT = detectedProjects.length > 1;

  const collectFiles = (root) => {
    if (!root || !exists(root)) return [];
    const out = [];
    const walk = (dir) => {
      for (const de of listDir(dir)) {
        const abs = toPosix(path.join(dir, de.name));
        if (de.isDirectory()) walk(abs);
        else if (isCodeFile(de.name)) out.push(abs);
      }
    };
    walk(root);
    out.sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"}));
    return out;
  };
  const collectFilesFromRoots = (roots) =>
      roots.flatMap(r => collectFiles(r));

// --------------------
// Frontend (Vite) zusätzlich erkennen
// --------------------
  let frontendSourceRoots = [];
  if (ACTIVE_PROFILE === "java" || ACTIVE_PROFILE === "javakotlin") {
    const viteRoot = findViteProjectRoot(qcRoot);
    if (viteRoot) {
      const viteSrc = resolveRoot(viteRoot, "src");
      if (viteSrc) {
        frontendSourceRoots = [viteSrc];
        new Notice("ℹ️ Frontend (Vite) erkannt");
      }
    }
  }

  const frontendFiles = frontendSourceRoots.flatMap(r =>
      collectFrontendFiles(r)
  );

  const srcFiles = collectFilesFromRoots(sourceRoots);
  const incFiles = collectFiles(includeRoot);
  const qcAllFiles = collectAllFiles(qcRoot);


  const isUnder = (parent, child) => {
    if (!parent || !child) return false;
    try {
      const rel = toPosix(path.relative(parent, child));
      if (!rel) return false;
      return !rel.startsWith("..");
    } catch {
      return false;
    }
  };

  const specialRoots = [
    includeRoot,
    ...sourceRoots,
    testRoot,
    resourceRoot,
    x64Root,
    ...frontendSourceRoots
  ].filter(Boolean);

  const qcFilesFiltered = qcAllFiles.filter(f =>
      !specialRoots.some(r => isUnder(r, f))
  );

  let out = "# Erarbeitete Lösung\n\n";
  const maxHeadingLevel = MAX_HEADING_LEVEL;


// =========================
// CODEBLOCK B: Compose Output
// =========================

  const EMBED_LANG_BY_PROFILE = {
    cpp_mfc: "cpp",
    java: "java",
    node: "js"
  };
  const embedLang = EMBED_LANG_BY_PROFILE[ACTIVE_PROFILE] ?? "txt";

// Für Java/Node sind includeRoot/x64Root evtl. null – das ist ok.
  const exclude = new Set(PROJECT_PROFILES[ACTIVE_PROFILE].mainFiles?.map(f => f.toLowerCase()) ?? []);


  const skipTopFolder = (ACTIVE_PROFILE === "cpp_mfc") ? projectName : null;

// 1) Main
  out += buildMainSection(
      [...srcFiles, ...qcFilesFiltered],
      ACTIVE_PROFILE,
      embedLang,
      toVaultRel
  );
  const publicRoot =
      profileRoots.public?.map(r => resolveRoot(qcRoot, r)).find(Boolean);

  const publicFiles = collectFrontendFiles(publicRoot);

  if (publicFiles.length) {
    out += buildTree(
        "Public",
        publicFiles,
        publicRoot,
        null,
        null,
        "txt",
        toVaultRel,
        maxHeadingLevel
    );
  }

// 2) Include
  if (includeRoot)
    out += buildTree(
        "Include",
        incFiles,
        includeRoot,
        skipTopFolder,
        null,
        embedLang,
        toVaultRel,
        maxHeadingLevel
    );


  const isResourceFile = (name) =>
      (PROJECT_PROFILES[ACTIVE_PROFILE].resourceExtensions ?? [])
          .some(ext => name.toLowerCase().endsWith(ext));


  if (resourceRoot) {
    const resFiles = collectResourceFiles(resourceRoot);

    if (resFiles.length) {
      out += buildTree(
          "Resources",
          resFiles.filter(f => isResourceFile(path.basename(f))),
      resourceRoot,
          null,
          null,
          "txt",
          toVaultRel,
          maxHeadingLevel
      );
    }
  }


// 2.5) Config (profilgetrieben, nicht nur node)
  if (configFiles.length) {
    out += buildTree(
        "Config",
        configFiles,
        qcRoot,
        null,
        null,
        "txt",
        toVaultRel,
        maxHeadingLevel
    );
  }


// =========================
// MULTI PROJECT RENDER
// =========================

  if (IS_MULTI_PROJECT) {
    for (const project of detectedProjects) {

      // --- Projekt-Roots ---
      const projectIncludeRoot  = resolveRoot(project.root, "Include");
      const projectSourceRoot   = resolveRoot(project.root, "Source");
      const projectResourceRoot = resolveRoot(project.root, "res");
      const projectX64Root      = resolveRoot(project.root, "x64");

      // --- Alle Dateien des Projekts ---
      const projectAllFiles = collectAllFiles(project.root);

      // --- Tracking: was wird irgendwo gerendert? ---
      const renderedFiles = new Set();

      out += `\n# Projektteil: ${project.name}\n`;

      // =====================
      // Include
      // =====================
      if (projectIncludeRoot) {
        const incFiles = collectFiles(projectIncludeRoot);
        incFiles.forEach(f => renderedFiles.add(f));

        out += buildTree(
            "Include",
            incFiles,
            projectIncludeRoot,
            null,
            null,
            embedLang,
            toVaultRel,
            maxHeadingLevel
        );
      }

      // =====================
      // Source
      // =====================
      if (projectSourceRoot) {
        const srcFiles = collectFiles(projectSourceRoot);
        srcFiles.forEach(f => renderedFiles.add(f));

        out += buildTree(
            "Source",
            srcFiles,
            projectSourceRoot,
            null,
            null,
            embedLang,
            toVaultRel,
            maxHeadingLevel
        );
      }

      // =====================
      // Resources (alles!)
      // =====================
      if (projectResourceRoot) {
        const resFiles = collectAllFiles(projectResourceRoot);
        resFiles.forEach(f => renderedFiles.add(f));

        out += buildTree(
            "Resources",
            resFiles,
            projectResourceRoot,
            null,
            null,
            "txt",
            toVaultRel,
            maxHeadingLevel
        );
      }

      // =====================
      // Build / x64 (alles!)
      // =====================
      if (projectX64Root) {
        const buildFiles = collectAllFiles(projectX64Root);
        buildFiles.forEach(f => renderedFiles.add(f));

        if (ACTIVE_PROFILE === "cpp_mfc") {
          out += buildExeLinksFromX64(projectX64Root, toVaultRel);
        }
      }

      // =====================
      // Assets (profilunabhängig)
      // =====================
      const assetFiles = projectAllFiles.filter(f =>
          isAssetFile(path.basename(f))
      );
      assetFiles.forEach(f => renderedFiles.add(f));

      if (assetFiles.length) {
        out += "\n## Assets\n\n";
        for (const abs of assetFiles) {
          out += `![[${toVaultRel(abs)}|${path.basename(abs)}]]\n`;
        }
        out += "\n";
      }

      // =====================
      // Container-Dateien
      // =====================
      const containerFiles = projectAllFiles.filter(f =>
          isContainerFile(path.basename(f))
      );
      containerFiles.forEach(f => renderedFiles.add(f));

      if (containerFiles.length) {
        out += "\n## Container\n\n";
        for (const abs of containerFiles) {
          out += `[[${toVaultRel(abs)}|${path.basename(abs)}]]\n`;
        }
        out += "\n";
      }

      // =====================
      // 🔥 Weitere Dateien = REST
      // =====================
      const remainingFiles = projectAllFiles.filter(f => !renderedFiles.has(f));

      if (remainingFiles.length) {
        out += "\n## Weitere Dateien\n\n";
        for (const abs of remainingFiles) {
          out += `[[${toVaultRel(abs)}|${path.basename(abs)}]]\n`;
        }
        out += "\n";
      }

      out += "\n---\n";
    }

    editor.replaceSelection(out.trim());
    new Notice("Multi-Project-Import abgeschlossen.");
    return;
  }

// =========================
// SOURCE rendering
// =========================
  const profile = PROJECT_PROFILES[ACTIVE_PROFILE];
  const autoSections = profile.autoSections;

  if (autoSections?.length) {

    out += "\n## Source\n\n";
    // Auto-sektionierte Source
    for (const root of sourceRoots) {
      const filesForRoot = srcFiles.filter(f => isUnder(root, f));
      const grouped = groupFilesByTopFolder(filesForRoot, root);
      out += `${path.basename(root)}\n\n`; // optional


      // 1) Definierte Sections
      for (const section of autoSections) {
        const files = grouped[section];
        if (!files?.length) continue;

        out += buildTree(
            section,
            files,
            root,
            null,
            null,
            embedLang,
            toVaultRel,
            maxHeadingLevel
        );

        delete grouped[section];
      }

      // 2) Fallback: übrige Ordner
      for (const [section, files] of Object.entries(grouped)) {
        if (!files.length) continue;

        out += buildTree(
            section,
            files,
            root,
            null,
            null,
            embedLang,
            toVaultRel,
            maxHeadingLevel
        );
      }
    }

  } else {

    // Klassische Source-Darstellung
    for (const root of sourceRoots) {
      const filesForRoot = srcFiles.filter(f => isUnder(root, f));

      out += buildTree(
          "Source",
          filesForRoot,
          root,
          skipTopFolder,
          exclude,
          embedLang,
          toVaultRel,
          maxHeadingLevel
      );
    }
  }
// =========================
// FRONTEND rendering (Node / Vite)
// =========================
  if (frontendSourceRoots.length && frontendFiles.length) {

    out += "\n## Frontend\n\n";

    const frontendProfile = PROJECT_PROFILES.node;
    const autoSections = frontendProfile.autoSections;
    const embedLang = "js";

    for (const root of frontendSourceRoots) {
      const filesForRoot = frontendFiles.filter(f => isUnder(root, f));
      const grouped = groupFilesByTopFolder(filesForRoot, root);

      // 1) Definierte Sections (pages, components, api, ...)
      for (const section of autoSections) {
        const files = grouped[section];
        if (!files?.length) continue;

        out += buildTree(
            section,
            files,
            root,
            null,
            null,
            embedLang,
            toVaultRel,
            maxHeadingLevel
        );

        delete grouped[section];
      }

      // 2) Rest
      for (const [section, files] of Object.entries(grouped)) {
        if (!files.length) continue;

        out += buildTree(
            section,
            files,
            root,
            null,
            null,
            embedLang,
            toVaultRel,
            maxHeadingLevel
        );
      }
    }
  }


  const containerFiles = qcAllFiles.filter(f =>
      isContainerFile(path.basename(f))
  );
  if (containerFiles.length) {
    out += "\n## Container\n\n";

    for (const abs of containerFiles) {
      const fileName = path.basename(abs);

      out += `### ${fileName}\n`;
      out += `[[${toVaultRel(abs)}|${fileName}]]\n`;
      out += "```embed-txt\n";
      out += `PATH: "vault://${toVaultRel(abs)}"\n`;
      out += `TITLE: "${fileName}"\n`;
      out += "```\n\n";
    }
  }


// 4) Non-Code-Dateien nur im Quellcode-Root (ohne special roots)

  if (ACTIVE_PROFILE === "cpp_mfc") {
    out = buildExeLinksFromX64(x64Root, toVaultRel) + out;
  }
  const assetFiles = qcAllFiles.filter(f =>
      isAssetFile(path.basename(f))
  );



  const otherFiles = qcAllFiles.filter(f =>
      !assetFiles.includes(f) &&
      !containerFiles.includes(f) &&
      !specialRoots.some(r => isUnder(r, f))
  );


  out += buildNonCodeLinksAtBottom(otherFiles, toVaultRel);




  if (assetFiles.length) {
    out += "\n## Assets\n\n";
    for (const abs of assetFiles) {
      out += `![[${toVaultRel(abs)}|${path.basename(abs)}]]\n`;
    }
    out += "\n";
  }
  new Notice(
      `Profile: ${ACTIVE_PROFILE} `
      + `(lang=${profileFromLanguage ?? "–"}, `
      + `structure=${profileFromStructure ?? "–"})`
  );
  const hasResources =
      resourceRoot &&
      collectResourceFiles(resourceRoot).length > 0;

  if (!srcFiles.length && !incFiles.length && !hasResources) {
    new Notice("️ Keine relevanten Dateien gefunden – Profil passt evtl. nicht.");
  }

  new Notice(" Fertig: Main, Quellcode, Include, Source und Tests generiert.");
  editor.replaceSelection(out.trim());

};
