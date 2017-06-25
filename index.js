'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _ghostStorageBase = require('ghost-storage-base');

var _ghostStorageBase2 = _interopRequireDefault(_ghostStorageBase);

var _path = require('path');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var readFileAsync = (0, _bluebird.promisify)(_fs.readFile);

var stripLeadingSlash = function stripLeadingSlash(s) {
  return s.indexOf('/') === 0 ? s.substring(1) : s;
};

var Store = function (_BaseStore) {
  _inherits(Store, _BaseStore);

  function Store() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Store);

    var _this = _possibleConstructorReturn(this, (Store.__proto__ || Object.getPrototypeOf(Store)).call(this, config));

    _awsSdk2.default.config.setPromisesDependency(_bluebird2.default);

    var accessKeyId = config.accessKeyId,
        assetHost = config.assetHost,
        bucket = config.bucket,
        pathPrefix = config.pathPrefix,
        region = config.region,
        secretAccessKey = config.secretAccessKey;


    _this.accessKeyId = accessKeyId;
    _this.bucket = bucket;
    _this.host = assetHost || 'https://s3' + (region === 'us-east-1' ? '' : '-' + region) + '.amazonaws.com/' + bucket;
    _this.pathPrefix = stripLeadingSlash(pathPrefix || '');
    _this.region = region;
    _this.secretAccessKey = secretAccessKey;
    return _this;
  }

  _createClass(Store, [{
    key: 'delete',
    value: function _delete(fileName, targetDir) {
      var _this2 = this;

      var directory = targetDir || this.getTargetDir(this.pathPrefix);

      return new _bluebird2.default(function (resolve, reject) {
        return _this2.s3().deleteObject({
          Bucket: _this2.bucket,
          Key: stripLeadingSlash((0, _path.join)(directory, fileName))
        }).promise().then(function () {
          return resolve(true);
        }).catch(function () {
          return resolve(false);
        });
      });
    }
  }, {
    key: 'exists',
    value: function exists(fileName) {
      var _this3 = this;

      return new _bluebird2.default(function (resolve, reject) {
        return _this3.s3().getObject({
          Bucket: _this3.bucket,
          Key: stripLeadingSlash(fileName)
        }).promise().then(function () {
          return resolve(true);
        }).catch(function () {
          return resolve(false);
        });
      });
    }
  }, {
    key: 's3',
    value: function s3() {
      return new _awsSdk2.default.S3({
        accessKeyId: this.accessKeyId,
        bucket: this.bucket,
        region: this.region,
        secretAccessKey: this.secretAccessKey
      });
    }
  }, {
    key: 'save',
    value: function save(image, targetDir) {
      var _this4 = this;

      var directory = targetDir || this.getTargetDir(this.pathPrefix);

      return new _bluebird2.default(function (resolve, reject) {
        _bluebird2.default.all([_this4.getUniqueFileName(_this4, image, directory), readFileAsync(image.path)]).then(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              fileName = _ref2[0],
              file = _ref2[1];

          return _this4.s3().putObject({
            ACL: 'public-read',
            Body: file,
            Bucket: _this4.bucket,
            CacheControl: 'max-age=' + 30 * 24 * 60 * 60,
            ContentType: image.type,
            Key: stripLeadingSlash(fileName)
          }).promise().then(function () {
            return resolve(_this4.host + '/' + fileName);
          });
        }).catch(function (error) {
          return reject(error);
        });
      });
    }
  }, {
    key: 'serve',
    value: function serve() {
      var _this5 = this;

      return function (req, res, next) {
        _this5.s3().getObject({
          Bucket: _this5.bucket,
          Key: stripLeadingSlash(req.path)
        }).on('httpHeaders', function (statusCode, headers, response) {
          res.set(headers);
        }).createReadStream().on('error', function (err) {
          res.status(404);
          console.log(err + '\nkey: ' + stripLeadingSlash(req.path));
          next();
        }).pipe(res);
      };
    }
  }, {
    key: 'read',
    value: function read() {
      /*
       * Dummy function as ghost needs it
       */
    }
  }]);

  return Store;
}(_ghostStorageBase2.default);

exports.default = Store;
module.exports = exports['default'];
