const fs = require('fs');
const path = require('path');

function removeComments(content) {
    const lines = content.split('\n');
    const result = [];
    let inMultiLineComment = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let newLine = '';
        let inString = false;
        let stringChar = '';
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = line[j + 1];
            
            if (!inString && !inMultiLineComment) {
                if ((char === '"' || char === "'" || char === '`') && line[j - 1] !== '\\') {
                    inString = true;
                    stringChar = char;
                    newLine += char;
                } else if (char === '/' && nextChar === '/') {
                    break;
                } else if (char === '/' && nextChar === '*') {
                    inMultiLineComment = true;
                    j++;
                } else {
                    newLine += char;
                }
            } else if (inString) {
                newLine += char;
                if (char === stringChar && line[j - 1] !== '\\') {
                    inString = false;
                    stringChar = '';
                }
            } else if (inMultiLineComment) {
                if (char === '*' && nextChar === '/') {
                    inMultiLineComment = false;
                    j++;
                }
            }
        }
        
        const trimmed = newLine.trimEnd();
        if (trimmed.length > 0 || newLine.length === 0) {
            result.push(trimmed);
        }
    }
    
    return result.join('\n').replace(/\n{3,}/g, '\n\n');
}

const handsPath = path.join(__dirname, 'App', 'Hands.ts');
const gameplayPath = path.join(__dirname, 'App', 'Screens', 'Gameplay.js');

const handsContent = fs.readFileSync(handsPath, 'utf8');
const gameplayContent = fs.readFileSync(gameplayPath, 'utf8');

fs.writeFileSync(handsPath, removeComments(handsContent), 'utf8');
fs.writeFileSync(gameplayPath, removeComments(gameplayContent), 'utf8');

console.log('Comments removed from Hands.ts and Gameplay.js');


