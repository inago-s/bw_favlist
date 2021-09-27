data = {
	limit: $('.main-limit :contains("読み放題期限")').next().text(),
	series: $('.work-detail :contains("シリーズ")').next().text().trim(),
	latest: $('.series .cmnShelf-info :contains("読み放題")').parent(':first').children('.cmnShelf-head').text()
}