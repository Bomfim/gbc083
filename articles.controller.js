class ArticlesController {
    constructor() {
        this._storage = [];
    }

    _findArticleById(id) {
        const article = this._storage.find(article => article.id === id);
        if (!article) {
            throw new Error('Article not found.');
        }
        return article;
    }

    getAll() {
        return this._storage;
    }

    getById(id) {
        return this._findArticleById(id);
    }

    create(id, name, description, author) {
        const newArticle = {
            id: id,
            name: name,
            description: description,
            author: author
        };
        this._storage.push(newArticle);
    }

    update(id, name, description, author) {
        const foundArticle = this._findArticleById(id);
        foundArticle.name = name;
        foundArticle.description = description;
        foundArticle.author = author;
        return foundArticle;
    }

    del(id) {
        const foundArticle = this._findArticleById(id);
        this._storage.splice(this._storage.indexOf(foundArticle), 1);
    }
}

module.exports = new ArticlesController();