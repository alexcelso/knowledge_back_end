const bcrypt = require('bcrypt-nodejs');
module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError } = app.api.validation;

    const ecryptPassword = password => {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, salt);
    }

    const save = async (req, res) => {
        const user = { ...req.body };
        if (req.param.id) user.id = req.param.id;

        if(!req.originalUrl.startsWith('/users')) user.admin = false;
        if(!req.user || !req.user.admin) user.admin = false;
        
        try {
            existsOrError(user.name, 'Nome não informado.');
            existsOrError(user.email, 'E-mail não informado.');
            existsOrError(user.password, 'Senha não informada.');
            existsOrError(user.confirmPassword, 'Confirmação de senha invalida.');
            equalsOrError(user.password, user.confirmPassword, 'Senhas não conferem.')

            const userFromDB = await app.db('users')
                .where({ email: user.email }).first();
            if (!user.id) {
                notExistsOrError(userFromDB, 'Usuário já cadastrado.')
            }
        } catch (msg) {
            return res.status(400).send(msg);
        }
        user.password = ecryptPassword(user.password);
        delete user.confirmPassword;

        if (user.id) {
            app.db('users')
                .update(user)
                .where({ id: user.id })
                .whereNull('deletedAt')
                .then(_ => res.status(204).send())
                .catch(error => res.status(500).send(error))
        } else {
            app.db('users')
                .insert(user)
                .then(_ => res.status(204).send())
                .catch(error => res.status(500).send(error))
        }
    }

    const get = (req, res) => {
        app.db('users')
            .select('id', 'name', 'email', 'admin')
            .whereNull('deletedAt')
            .then(users => res.json(users))
            .catch(erro => res.status(500).send())
    }

    const getById = (req, res) => {
        app.db('users')
            .select('id', 'name', 'email', 'admin')
            .where({ id: req.param.id })
            .whereNull('deletedAt')
            .first()
            .then(user => res.json(user))
            .catch(erro => res.status(500).send())
    }

    const remove = async (req, res) => {
        try {
            const articles = await app.db('articles')
                .where({ userId: req.params.id })
            notExistsOrError(articles, 'Usuário possui artigos.');

            const rowsUpdated = await app.db('users')
                .update({deletedAt: new Date()})
                .where({ id: req.params.id});
                existsOrError(rowsUpdated, 'Usuário nãofoi encontrado');
            res.status(204).send();    
        } catch (err) {
            res.status(400).send(err);
        }
    }

    return { save, get, getById, remove };
}