module.exports = {
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest' // Chuyển đổi các file .js, .jsx, .ts, .tsx bằng babel-jest
  },
  transformIgnorePatterns: [
    '/node_modules/(?!axios)/' // Cho phép Jest xử lý axios
  ],
};