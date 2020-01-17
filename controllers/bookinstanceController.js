var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

var async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all BookInstances
exports.bookinstance_list = function (req, res) {

	BookInstance.find()
		.populate('book')
		.exec(function (err, list_bookinstances) {
			if (err) { return next(err); }
			res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances, });
		});
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function (req, res) {
	BookInstance.findById(req.params.id)
		.populate('book')
		.exec(function (err, bookinstance) {
			if (err) { return next(err); }
			if (bookinstance == null) {
				var err = new Error('Book copy not found');
				err.status = 404;
				return next(err);
			}
			res.render('bookinstance_detail', { title: 'Copy: '+bookinstance.book.title, bookinstance: bookinstance, });
		});
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function (req, res) {
	Book.find({}, 'title')
		.exec(function (err, books) {
			if (err) { return next(err); }
			res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, status_values: BookInstance.schema.path('status').enumValues, });
		});
};

// Handle BookInstance create on POST
exports.bookinstance_create_post = [
	// Validate fields.
	body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
	body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
	body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

	// Sanitize fields.
	sanitizeBody('book').escape(),
	sanitizeBody('imprint').escape(),
	sanitizeBody('status').trim().escape(),
	sanitizeBody('due_back').toDate(),

	// Process request after validation and sanitization
	(req, res, next) => {
		// Extract the validation errors from a request
		const errors = validationResult(req);

		// Create a BookInstance object with escaped and trimmed data
		var bookinstance = new BookInstance(
			{
				book: req.body.book,
				imprint: req.body.imprint,
				status: req.body.status,
				due_back: req.body.due_back,
			}
		);

		if (!errors.isEmpty()) {
			Book.find({}, 'title')
				.exec(function (err, books) {
					if (err) { return next(err); }
					res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance, status_values: BookInstance.schema.path('status').enumValues,  });
				});
			return;
		} else {
			bookinstance.save(function(err) {
				if (err) { return next(err); }
				res.redirect(bookinstance.url);
			});
		}
	},
];

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function (req, res) {
	BookInstance.findById(req.params.id)
		.populate('book')
		.exec(function (err, bookinstance) {
			if (err) { return next(err); }
			if (bookinstance == null) {
				res.redirect('/catalog/bookinstances');
			}
			res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance: bookinstance, });
		});
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function (req, res) {
	BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err) {
		if (err) { return next(err); }
		res.redirect('/catalog/bookinstances');
	});
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function (req, res) {
	async.parallel({
		bookinstance: function(callback) {
			BookInstance.findById(req.params.id)
			.populate('book')
			.exec(callback);
		},
		books: function(callback) {
			Book.find({}, 'title').exec(callback);
		},
	}, function (err, results) {
		if (err) { return next(err); }
		if (results.bookinstance==null) {
			var err = new Error('BookInstance not found');
			err.status = 404;
			return next(err);
		}
		res.render('bookinstance_form', {title: 'Update BookInstance', book_list: results.books, selected_book: results.bookinstance.book._id, bookinstance: results.bookinstance, status_values: BookInstance.schema.path('status').enumValues,  });
	});
};

// Handle BookInstance update on POST
exports.bookinstance_update_post = [
	// Validate fields.
	body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
	body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
	body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

	// Sanitize fields.
	sanitizeBody('book').escape(),
	sanitizeBody('imprint').escape(),
	sanitizeBody('status').escape(),
	sanitizeBody('due_back').escape(),

	// Process request after validation and sanitization
	(req, res, next) => {
		// Extract the validation errors from a request
		const errors = validationResult(req);

		// Create a BookInstance object with escaped and trimmed data
		var bookinstance = new BookInstance(
			{
				book: req.body.book,
				imprint: req.body.imprint,
				status: req.body.status,
				due_back: req.body.due_back,
				_id: req.params.id,
			}
		);

		if (!errors.isEmpty()) {
			Book.find({}, 'title')
				.exec(function (err, books) {
					if (err) { return next(err); }
					res.render('bookinstance_form', {title: 'Update BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance, status_values: BookInstance.schema.path('status').enumValues,  });
				});
			return;
		} else {
			BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err, thebookinstance) {
				if (err) { return next(err); }
				res.redirect(thebookinstance.url);
			});
		}
	},

];
