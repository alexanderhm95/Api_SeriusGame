const bcryptjs = require('bcryptjs');
const longEncript = process.env.logEncript;

const encrypt = async (password) => {
    const hash = await bcryptjs.hash(password, longEncript);
    return hash;
}

const compare = async (password, hash) => {
    const result = await bcryptjs.compare(password, hash);
    return result;
}

const decrypt = async (password) =>{
    const hash = await bcryptjs.hash(password, 10);
    return hash;
} 

module.exports = { encrypt, compare , decrypt};