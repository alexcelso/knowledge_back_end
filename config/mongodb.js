const mongoose = require('mongoose');
const uri = 'mongodb://localhost/knowledge_stats';
mongoose.set('useUnifiedTopology', true);
mongoose.connect(uri, {useNewUrlParser: true})
    .catch(e => {
        const msg = 'ERRO! não foi possível conectar ao MongoDB.'
        console.log('\x1bm%s\x1b[37m', msg, '\x1b[0m');
    })