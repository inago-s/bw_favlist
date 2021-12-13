data = {
	release: $('.work-detail :contains("配信開始日")').next().text().trim(),
	limit: $('.main-limit :contains("読み放題期限")').next().text().trim(),
	series: $('.work-detail :contains("シリーズ")').next().text().trim(),
	latest: $('.series .cmnShelf-info :contains("読み放題")').parent(':first').children('.cmnShelf-head').text(),
	magazine_flag: $('.a-icon-tag').text().includes('雑誌')
}