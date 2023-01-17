const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");
const async = require("async");


// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate("book")
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      // Successful, so render
      res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_detail", {
        title: `Copy: ${bookinstance.book.title}`,
        bookinstance,
      });
    });
};


// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
  Book.find({}, "title").exec((err, books) => {
    if (err) {
      return next(err);
    }
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      book_list: books,
    });
  });
};


// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    // console.log(bookinstance)

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
        console.log(books)
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          book_list: books,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      });
      return;
    }

    // Data from form is valid.
    bookinstance.save((err) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to new record.
      res.redirect(bookinstance.url);
    });
  },
];


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) => {
  BookInstance.findById(req.params.id)
    .populate("book")
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("bookinstance_delete", {
        title: `Delete bookinstance: ${bookinstance.book.title}, ${bookinstance.imprint}`,
        bookinstance,
        // book: bookinstance.book._id,
      });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
  BookInstance.findById(req.body.bookinstanceid)
    .exec((err, bookinstance) => {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        // No results.
        const err = new Error("Book copy not found");
        err.status = 404;
        return next(err);
      }
      
      const bookId = bookinstance.book._id.toString();

      BookInstance.findByIdAndRemove(bookinstance._id, (err)=>{
        if (err) {
          return next(err);
        }
        res.redirect(`/catalog/book/${bookId}`);
      })
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) => {
  // find the bookinstance by req.params.id
  async.parallel({
    bookinstance(callback){
      BookInstance.findById(req.params.id).exec(callback);
    }, 
    list_of_books(callback){
      Book.find({}, 'title').exec(callback); 
    }
  }, (err, results)=>{
    //if some error
    if(err){
      return next(err)
    }; 
    // if no results (someone added not existing id into the browser address line)
    if(results.bookinstance == null){
      const err = new Error('Bookinstance not found');
      err.status = 404; 
      return next(err);
    };
    //successs, so render the bookinstance form with passed bookinstance object and array of book objects
    res.render('bookinstance_form', {
      title: "Update Copy",
      book_list: results.list_of_books,
      selected_book: results.bookinstance.book._id,
      bookinstance: results.bookinstance,
    })
  })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // sanitize and validate the posted data
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  
  // process request
  (req, res, next)=>{
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data that is posted in the request body object
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values and error messages.
      Book.find({}, "title").exec(function (err, books) {
        if (err) {
          return next(err);
        }
        // Successful, so render.
    
        res.render("bookinstance_form", {
          title: "Update Copy",
          book_list: books,
          selected_book: bookinstance.book._id,
          bookinstance,
          errors: errors.array(),
        });
      });
      return;
    }

    //the posted data is OK, so save the updated bookinstance and redirect to the updated bookinstance detail page
    BookInstance.findByIdAndUpdate(bookinstance._id, bookinstance, {}, (err, thebookinstance) => {
      if (err) {
        return next(err);
      }
      // Successful: redirect to book detail page.
      res.redirect(thebookinstance.url);
    });
  }
];
