chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.msg == "fav") {
			let book = normalize_str(request.book);
			let content = normalize_str(request.content);
			let series = normalize_str(request.series);
			info = {
				history: [book],
				content: content,
				series: series
			}
			put_db(info, 'fav_content');
			sendResponse({});
		}
		else if (request.msg == "unfav") {
			let content = normalize_str(request.content);
			let series = normalize_str(request.series);
			params = [content, series];
			delete_db(params, 'fav_content');
			sendResponse({});
		}
		else if (request.msg == "read") {
			let content = normalize_str(request.content);
			let series = normalize_str(request.series);
			let book = normalize_str(request.book);
			params = [content, series];
			read_content(params, book, 'fav_content');
			sendResponse({});
		}
		else if (request.msg == "unread") {
			let content = normalize_str(request.content);
			let series = normalize_str(request.series);
			let book = normalize_str(request.book);
			params = [content, series];
			unread_content(params, book, 'fav_content');
			sendResponse({});
		}
		else if (request.msg == "get-title") {
			let content = normalize_str(request.content);
			let series = normalize_str(request.series);
			params = [content, series];
			get_db(params, 'fav_content', function (data) {
				sendResponse(data);
			})
			return true;
		}
		else if (request.msg == "get-series") {
			get_series(request.URL, function (data) {
				sendResponse(data);
			})
			return true;
		}
	}

);

chrome.runtime.onInstalled.addListener(function () {
	const dbName = 'bw-extension';
	let openRequest = indexedDB.open(dbName);

	openRequest.onupgradeneeded = function (envent) {
		let db = openRequest.result;
		db.createObjectStore("fav_content", { keyPath: ['content', 'series'] });
		db.createObjectStore("books", { keyPath: 'book' });
		db.createObjectStore("series", { keyPath: 'series' });
	}
	openRequest.onsuccess = function () {
		let db = openRequest.result;
		db.close();
	}
	openRequest.onerror = function (event) {
		console.log('db open error');
	}
});

chrome.management.onUninstalled.addListener(function () {
	const dbName = 'bw-extension';
	indexedDB.deleteDatabase(dbName);
});

function get_db(params, store, callback) {
	const dbName = 'bw-extension';
	let openRequest = indexedDB.open(dbName);

	openRequest.onsuccess = function () {
		let db = openRequest.result;
		let transaction = db.transaction(store, 'readonly');
		let data = transaction.objectStore(store);

		let request = data.get(params);

		transaction.oncomplete = function () {
			callback(request.result);
		}

		request.onerror = function () {
			console.log('db error');
			callback(false);
		}

	}
}

function get_series(URL, callback) {
	chrome.tabs.create({
		url: URL, active: false
	}, function (tabs) {
		setTimeout(function () {
			chrome.scripting.executeScript({
				target: { tabId: tabs.id },
				files: ['js/jquery-3.6.0.min.js', 'js/get_book_info.js']
			}, (InjectionResult) => {
				chrome.tabs.remove(tabs.id);
				callback(InjectionResult[0].result);
			})
		}, 500);
	});
}

function put_db(params, store) {
	const dbName = 'bw-extension';
	let openRequest = indexedDB.open(dbName);

	openRequest.onsuccess = function () {
		let db = openRequest.result;
		let transaction = db.transaction(store, 'readwrite');
		let data = transaction.objectStore(store);

		let request = data.put(params);

		request.onsuccess = function () {
			return true;
		}

		request.onerror = function () {
			console.log('db error');
			return false;
		}

	}
}

function delete_db(params, store) {
	const dbName = 'bw-extension';
	let openRequest = indexedDB.open(dbName);

	openRequest.onsuccess = function () {
		let db = openRequest.result;
		let transaction = db.transaction(store, 'readwrite');
		let data = transaction.objectStore(store);

		let request = data.delete(params);

		request.onsuccess = function () {
			return true;
		}

		request.onerror = function () {
			return false;
		}

	}
}

function read_content(params, book, store) {
	const dbName = 'bw-extension';
	let openRequest = indexedDB.open(dbName);

	openRequest.onsuccess = function () {
		let db = openRequest.result;
		let transaction = db.transaction(store, 'readwrite');
		let data = transaction.objectStore(store);

		let request = data.openCursor(IDBKeyRange.only(params));
		request.onsuccess = function () {
			let cursor = request.result;
			if (cursor) {
				if (!cursor.value.history.includes(book))
					cursor.value.history.push(book);
				let updateRequest = cursor.update(cursor.value);
				updateRequest.onsuccess = function () {
					console.log('update success');
				}
			}
		}
	}
}

function unread_content(params, book, store) {
	const dbName = 'bw-extension';
	let openRequest = indexedDB.open(dbName);

	openRequest.onsuccess = function () {
		let db = openRequest.result;
		let transaction = db.transaction(store, 'readwrite');
		let data = transaction.objectStore(store);

		let request = data.openCursor(IDBKeyRange.only(params));
		request.onsuccess = function () {
			let cursor = request.result;
			if (cursor) {
				cursor.value.history = cursor.value.history.filter(function (arr) {
					return arr != book;
				})
				let updateRequest = cursor.update(cursor.value);
				updateRequest.onsuccess = function () {
					console.log('update success');
				}
			}
		}
	}
}

function normalize_str(str) {
	let regex = /[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝]/g;
	str = str.replace(regex, function (s) {
		return String.fromCharCode(s.charCodeAt(0) - 65248);
	}).replace(/[‐－―]/g, "-").replace(/[～〜]/g, "~").replace(/　/g, " ");

	return str;
}