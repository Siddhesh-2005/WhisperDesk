
const HINGLISH_SLURS = [
    // Direct Slurs
    
    /ch[uùú]t[iíy][ay@]/i,
    /bh[e3]nch[o0]d/i,
    /m[a@]d[a@]rch[o0]d/i,
    /l[o0]nd[a@]/i,
    /l[au]nd[a@]/i,
    /r[a@]nd[iíy]/i,
    /bh[o0]sd[iíy]k[e3]/i,
    
    
    // Abbreviations
    /\bmc\b/i,
    /\bbc\b/i,
    
    // Phrases/Combinations
    /m[aa] k[ii] ch[uu]t/i,
    /g[aa]nd m[aa]r/i
];

/**
 * Checks if the text contains any locally blacklisted Hinglish slurs.
 * @param {string} text 
 * @returns {boolean}
 */
export const isLocalBlacklisted = (text) => {
    if (!text) return false;
    
    const cleanText = text.trim();

    return HINGLISH_SLURS.some(pattern => pattern.test(cleanText));
};