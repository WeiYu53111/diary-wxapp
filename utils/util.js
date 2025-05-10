const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}


/**
 * 将各种格式的日期字符串转换为iOS兼容的格式
 * @param {string} dateString - 日期字符串
 * @returns {Date} - 日期对象
 */
function parseDate(dateString) {
  if (!dateString) return null;
  
  // 如果已经是标准格式，则直接返回
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}(T| )\d{1,2}:\d{1,2}:\d{1,2}/.test(dateString)) {
    return new Date(dateString);
  }
  
  // 处理 "Sat May 10 10:57:54 CST 2025" 这样的格式
  try {
    // 尝试提取日期部分
    const parts = dateString.split(' ');
    if (parts.length >= 6) {
      // 提取月、日、年、时间
      const month = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      }[parts[1]];
      
      const day = parts[2].padStart(2, '0');
      const year = parts[5];
      const time = parts[3];
      
      // 组合成iOS友好格式 "YYYY-MM-DD HH:MM:SS"
      return new Date(`${year}-${month}-${day}T${time}`);
    }
  } catch (e) {
    console.error('日期解析错误:', e, dateString);
  }
  
  // 尝试使用时间戳
  if (!isNaN(dateString)) {
    return new Date(parseInt(dateString));
  }
  
  // 将日期格式化为 ISO 标准格式
  return new Date(dateString.replace(' ', 'T'));
}


// 添加处理图片URL的函数
/**
 * 处理图片URL，添加服务器地址和API前缀
 * @param {string} serverUrl - 服务器地址
 * @param {string} openid - 用户的openid
 * @param {string} imageUrl - 图片路径或文件名
 * @returns {string} - 完整的图片URL
 */
function processImageUrl(serverUrl, openid, imageUrl) {
  if (!imageUrl) return '';
  
  // 如果已经是完整URL（以http开头），则直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // 图片API前缀
  const imageApiPrefix = '/api/images/view';
  
  // 移除可能存在的前导斜杠
  const cleanImagePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
  
  // 构建完整URL，使用查询参数格式: ?id=openid&file=xxx
  return `${serverUrl}${imageApiPrefix}?id=${openid}&file=${cleanImagePath}`;
}

module.exports = {
  formatTime,
  parseDate,
  processImageUrl
}
