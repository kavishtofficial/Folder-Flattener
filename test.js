const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
const removeExtension = (str) => {
  const dotIndex = str.lastIndexOf('.');
  return dotIndex !== -1 ? str.substring(0, dotIndex) : str;
};

const file = "ocr_About the Journal.CARI_IJCE.pdf";
const excel1 = "ocr_About_the_Journal_CARI_IJCE"; // dot replaced by underscore, no ext
const excel2 = "ocr_About_the_Journal.CARI_IJCE"; // has dot, no ext

console.log("File normOrigNoExt: ", normalize(removeExtension(file)));
console.log("Excel1 normOldNoExt: ", normalize(removeExtension(excel1)));
console.log("Excel2 normOldNoExt: ", normalize(removeExtension(excel2)));
