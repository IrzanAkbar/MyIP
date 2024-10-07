import { get } from 'https';
import { refererCheck } from '../common/referer-check.js';

// 验证请求合法性
function isValidRequest(req) {
    const isLatitudeValid = /^-?\d+(\.\d+)?$/.test(req.query.latitude);
    const isLongitudeValid = /^-?\d+(\.\d+)?$/.test(req.query.longitude);
    const isLanguageValid = /^[a-z]{2}$/.test(req.query.language);
    const isCanvasModeValid = /^(CanvasLight|RoadDark)$/.test(req.query.CanvasMode); // You can map these to Mapbox styles

    if (!isLatitudeValid || !isLongitudeValid || !isLanguageValid || !isCanvasModeValid) {
        return false;
    } else {
        return true;
    }
}

export default (req, res) => {
    // 限制只能从指定域名访问
    const referer = req.headers.referer;
    if (!refererCheck(referer)) {
        return res.status(403).json({ error: referer ? 'Access denied' : 'What are you doing?' });
    }

    // 检查请求是否合法
    if (!isValidRequest(req)) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    // 使用 req.query 获取参数
    const { latitude, longitude, language, CanvasMode } = req.query;

    if (!latitude || !longitude || !language) {
        return res.status(400).json({ error: 'Missing latitude, longitude, or language' });
    }

    const mapSize = '800x640'; // Mapbox requires size in 'widthxheight' format
    const zoomLevel = 5; // You can adjust zoom level if needed

    const apiKeys = (process.env.MAPBOX_API_KEY || '').split(',');
    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

    // Mapbox styles corresponding to your CanvasMode (you can map them based on your needs)
    const mapboxStyles = {
        CanvasLight: 'mapbox/light-v10',
        RoadDark: 'mapbox/dark-v10'
    };

    const style = mapboxStyles[CanvasMode]; // Map your CanvasMode to Mapbox styles
    const url = `https://api.mapbox.com/styles/v1/${style}/static/${longitude},${latitude},${zoomLevel}/${mapSize}?access_token=${apiKey}`;

    get(url, apiRes => {
        apiRes.pipe(res);
    }).on('error', (e) => {
        res.status(500).json({ error: e.message });
    });
};
