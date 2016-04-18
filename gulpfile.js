var gulp = require('gulp'),
    watch =  require('gulp-watch'),
    connect = require('gulp-connect');

gulp.task('watch', function() {
  watch('./app.js').pipe(connect.reload());
});

gulp.task('serve', function() {
  connect.server({
    root: './',
    livereload: true,
    port: 3000,
    host: '10.2.3.201'
  });
});

gulp.task('default', ['serve', 'watch']);