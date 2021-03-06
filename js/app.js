//Globals
var ENTER_KEY = 13;
var ESC_KEY = 27;

//Handlebars equality, compares the filter property of the object (app).
Handlebars.registerHelper('eq', function (a, b, options) {
	return a === b ? options.fn(this) : options.inverse(this);
});

//Utility
var utility = {
	uuid: function () {
		var i, random;
		var uuid = '';
		for (i = 0; i < 32; i++) {
			random = Math.random() * 16 | 0;
			if (i === 8 || i === 12 || i === 16 || i === 20) {
				uuid += '-';
			}
			uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
		}
		return uuid;
	},
	store: function (namespace, data) {
		if (arguments.length > 1) {
			return localStorage.setItem(namespace, JSON.stringify(data))
		} else {
			return (JSON.parse(localStorage.getItem(namespace)) || [])
		}
	},
	pluralize: function (todoCount, word) {
		return todoCount === 1 ? word : word + 's'; // 1 = item; 0/2+ = items
	}
};

// Application
var app = {
	init: function () {
		this.todos = utility.store('LS-todos');
		this.todoTemplate = Handlebars.compile($('#todoTemplate').html());
		this.footerTemplate = Handlebars.compile($('#footerTemplate').html());
		this.bindEvents();

		new Router({
			'/:filter': function (filter) {
				this.filter = filter;
				this.render();
			}.bind(this)
		}).init('/all');
	},
	bindEvents: function () {
		$('.new-todo').on('keyup', this.create.bind(this));
		$('.toggle-all').on('change', this.toggleAll.bind(this));
		$('.footer').on('click', '#clearCompleted', this.deleteCompleted.bind(this));
		$('.todo-list')
			.on('click', '.deleteBtn', this.delete.bind(this))
			.on('change', '.toggle', this.toggle.bind(this))
			.on('dblclick', 'label', this.editMode.bind(this))
			.on('keyup', '.edit', this.editKeyup.bind(this))
			.on('focusout', '.edit', this.update.bind(this));
	},
	render: function () {
		$('#new-todo').focus();
		var todos = this.getFilteredTodos();
		utility.store('LS-todos', this.todos);
		$('.todo-list').html(this.todoTemplate(this.todos));
		$('.main').toggle(todos.length > 0);
		$('.toggle-all').prop('checked', this.getActiveTodos().length === 0); //When all todos are completed, toggle on
		this.renderFooter();

	},
	renderFooter: function () {
		var template = this.footerTemplate({
			activeTodoCount: this.getActiveTodos().length,
			activeWord: utility.pluralize(this.getActiveTodos().length, 'item'),
			completedTodos: this.todos.length - this.getActiveTodos().length,
			filter: this.filter,
		});
		$('.footer').toggle(this.todos.length > 0).html(template);
	},
	create: function (event) {
		var $input = $(event.target);
		var value = $input.val().trim();

		if (event.which !== ENTER_KEY || !value) {
			return;
		};

		this.todos.push({
			title: value,
			id: utility.uuid(),
			completed: false,
		});
		$input.val('');
		this.render();
	},
	delete: function (event) {
		this.todos.splice(this.elementIndexNumber(event), 1);
		this.render();
	},
	elementIndexNumber: function (event) {
		var id = event.target.closest('li').id;
		for (var i = 0; i < this.todos.length; i++) {
			if (this.todos[i].id === id) {
				return i;
			};
		};
	},
	toggle: function (event) {
		var id = this.elementIndexNumber(event)
		this.todos[id].completed = !this.todos[id].completed;
		this.render();
	},
	toggleAll: function () {
		var toggleState = $(event.target).prop('checked'); //.prop('checked') returns a boolean value based on the check/unchecked status of the toggle-button

		for (var i = 0; i < this.todos.length; i++) {
			this.todos[i].completed = toggleState;
		};

		this.render();
	},
	editMode: function (event) {
		var $input = $(event.target).closest('li').addClass('editing').find('.edit')
		$input.val($input.val()).focus();
	},
	editKeyup: function (event) {
		if (event.which === ENTER_KEY) {
			event.target.blur();
		};

		if (event.which === ESC_KEY) {
			$(event.target).data('abort', true).blur();
		};
	},
	update: function (event) {
		var input = $(event.target).val().trim();

		if (!input) { //!"" = true (empty field)
			this.delete(event);
			this.render();
		};

		if ($(event.target).data('abort')) {
			$(event.target).data('abort', false);
		} else {
			this.todos[this.elementIndexNumber(event)].title = input
		};

		this.render();
	},
	getActiveTodos: function () {
		return this.todos.filter(function (todo) {
			return !todo.completed; //not completed is false, therefore !.completed = true
		})
	},
	getCompletedTodos: function () {
		return this.todos.filter(function (todo) {
			return todo.completed; //completed is true
		})
	},
	getFilteredTodos: function () {
		if (this.filter === 'active') {
			return this.getActiveTodos();
		};
		if (this.filter === 'completed') {
			return this.getCompletedTodos();
		};
		return this.todos; //filter: 'all'
	},
	deleteCompleted: function () {
		this.todos = this.getActiveTodos(); //Dynamically remove all completed todos by setting this.todos to only active todos
		this.filter = 'all';
		this.render();
	},
};

app.init()
