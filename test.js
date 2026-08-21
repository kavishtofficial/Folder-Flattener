const MAX_FILENAME_LENGTH = 100;
function truncateLikeApp(originalName) {
    const cleanedName = originalName.replace(/[<>:"/\\|?*]/g, '_');
    let baseName;
    let extension;
    const dotIndex = cleanedName.lastIndexOf('.');
    if (dotIndex !== -1) {
      baseName = cleanedName.substring(0, dotIndex);
      extension = cleanedName.substring(dotIndex);
    } else {
      baseName = cleanedName;
      extension = '';
    }
    let candidateName = cleanedName;
    if (candidateName.length > MAX_FILENAME_LENGTH) {
      const allowedBaseLength = Math.max(10, MAX_FILENAME_LENGTH - extension.length);
      baseName = baseName.substring(0, allowedBaseLength);
      candidateName = baseName + extension;
    }
    return candidateName;
}

const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const fullExcelName = "Exhibit XX-31, Scholarly Article, AutoPilot AI — Architecting Self-Healing ML Systems with Reinforcement Feedback Loops, IEEE ICITEICS 2025, Dated...pdf";
const osTruncatedName = "Exhibit XX-31, Scholarly Article, AutoPilot AI — Architecting Self-Healing ML Systems with Reinf.pdf";

const appFlattened = truncateLikeApp(osTruncatedName);
console.log("App Flattened: ", appFlattened);

const excelTruncated = truncateLikeApp(fullExcelName);
console.log("Excel Truncated: ", excelTruncated);

console.log("Match?", normalize(appFlattened) === normalize(excelTruncated));

