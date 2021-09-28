$(function () {
	let params = new URLSearchParams(location.search);
	let content_URL = 'https://bookwalker.jp/de' + params.get('cid');
	chrome.runtime.sendMessage({ msg: "get-series", URL: content_URL }, (response) => {
		CONTENT_RELEASE = response.release;
		CONTENT_LIMIT = Date(response.limit.slice(0, -2));
		CONTENT_SERIES = response.series;
		CONTENT_LATEST = response.latest;
		CONTENT_MAGAZINE = response.magazine_flag;
	});

	// 目次を押したとき
	$('#showTableOfContents').on('click', function () {
		setTimeout(function () {
			let page = $('#pageSliderCounter').text().split('/');
			page_late = (page[0] / page[1]);
			let scrollheight = $('#tableOfContents').get(0).scrollHeight - $("#tableOfContents").outerHeight();
			$('#tableOfContents').scrollTop(scrollheight * page_late);
			if (!location.hostname.includes('viewer-subscription') || !CONTENT_MAGAZINE) {
				return;
			}

			$("#tableOfContents").children('.ex-area').remove();
			let title = normalize_str($('title').text());
			let content = $("#tableOfContents").children('.item');
			let index = 0;
			read_title(index, title, content, read_title);
		}, 50);
	});

	//お気に入りボタン押したとき
	$(document).on("click", '.ex-fav-area', function () {
		let content = $(this).parent().next().text();
		let title = $('title').text();
		let params = new URLSearchParams(location.search);
		if (!($(this).hasClass('ex-fav'))) {
			$(this).addClass('ex-fav');
			chrome.runtime.sendMessage({ msg: "fav", book: title, content: content, series: CONTENT_SERIES });
			chrome.runtime.sendMessage({ msg: "read", book: title, content: content, series: CONTENT_SERIES });
			// お気に入り作品の読書状況エリア
			let status = document.createElement('div');
			status.classList.add('ex-book-status', 'ex-book-status-read');
			status.textContent = "既読";
			$(this).parent().append(status);
		} else {
			let res = confirm(content + 'をお気に入りから外しますか？');
			if (res) {
				$(this).removeClass('ex-fav');
				chrome.runtime.sendMessage({ msg: "unfav", book: title, content: content, series: CONTENT_SERIES });
				$(this).parent().find('.ex-book-status').remove();
			}
		}
	})


	//　既読・未読ボタン押したとき
	$(document).on("click", '.ex-book-status', function () {
		let content = $(this).parent().next().text();
		let title = $('title').text();
		if ($(this).attr('class').includes('ex-book-status-unread')) {
			$(this).removeClass('ex-book-status-unread');
			$(this).addClass('ex-book-status-read');
			$(this).text("既読");
			chrome.runtime.sendMessage({ msg: "read", book: title, content: content, series: CONTENT_SERIES });
		} else {
			$(this).removeClass('ex-book-status-read');
			$(this).addClass('ex-book-status-unread');
			$(this).text("未読");
			chrome.runtime.sendMessage({ msg: "unread", book: title, content: content, series: CONTENT_SERIES });
		}
	})
});



function read_title(index, title, content, callback) {
	if (!(index < content.length)) {
		return;
	}
	chrome.runtime.sendMessage({ msg: "get-title", content: content[index].textContent, series: CONTENT_SERIES }, (response) => {
		if (response) {
			// extensionエリア
			let ex_area = document.createElement('div');
			ex_area.className = 'ex-area';

			// favブロック
			let fav_block = document.createElement('div');
			fav_block.className = 'ex-fav-area ex-fav';

			// favicon
			fav_block.append('★');

			// extentionエリアにfavブロックを挿入
			ex_area.appendChild(fav_block);

			// お気に入り作品の読書状況エリア
			let status = document.createElement('div');
			if (response.history.includes(title)) {
				status.classList.add('ex-book-status', 'ex-book-status-read');
				status.textContent = "既読";
				ex_area.appendChild(status);
			} else {
				status.classList.add('ex-book-status', 'ex-book-status-unread');
				status.textContent = "未読";
				ex_area.appendChild(status);
			}

			// itemクラスの前にextensionエリアの挿入
			content[index].before(ex_area);
		} else {
			// extensionエリア
			let ex_area = document.createElement('div');
			ex_area.className = 'ex-area';

			// favブロック
			let fav_block = document.createElement('div');
			fav_block.className = 'ex-fav-area';

			// favicon
			fav_block.append('★');

			// extentionエリアにfavブロックを挿入
			ex_area.appendChild(fav_block);

			// itemクラスの前にextensionエリアの挿入
			content[index].before(ex_area);
		}
		callback(++index, title, content, read_title);
	})
}

function normalize_str(str) {
	let regex = /[Ａ-Ｚａ-ｚ０-９！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝]/g;
	str = str.replace(regex, function (s) {
		return String.fromCharCode(s.charCodeAt(0) - 65248);
	}).replace(/[‐－―]/g, "-").replace(/[～〜]/g, "~").replace(/　/g, " ");

	return str;
}

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.msg == "user-add") {
			let title = $('title').text();
			chrome.runtime.sendMessage({ msg: "fav", book: title, content: request.content, series: CONTENT_SERIES });
			chrome.runtime.sendMessage({ msg: "read", book: title, content: request.content, series: CONTENT_SERIES });
			sendResponse('お気に入りに追加しました．');
		}
	}
);