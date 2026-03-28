const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const execAsync = promisify(exec);

// Resolve yt-dlp command — tries PATH first, then common Python Scripts locations
const YT_DLP_PATHS = [
  'yt-dlp',
  path.join(process.env.APPDATA || '', 'Python', 'Python313', 'Scripts', 'yt-dlp'),
  path.join(process.env.APPDATA || '', 'Python', 'Python312', 'Scripts', 'yt-dlp'),
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python313', 'Scripts', 'yt-dlp'),
  'python -m yt_dlp',
];

let _resolvedCmd = null;
async function getYtDlpCmd() {
  if (_resolvedCmd) return _resolvedCmd;
  for (const cmd of YT_DLP_PATHS) {
    try {
      await execAsync(`${cmd} --version`, { timeout: 8000 });
      _resolvedCmd = cmd;
      console.log(`[yt-dlp] Using: ${cmd}`);
      return cmd;
    } catch {}
  }
  throw new Error('yt-dlp not found. Install with: pip install yt-dlp');
}

/**
 * Extract playlist info using yt-dlp
 */
async function getPlaylistInfo(playlistUrl) {
  try {
    const cmd = await getYtDlpCmd();
    const { stdout } = await execAsync(
      `${cmd} --flat-playlist --dump-json --no-warnings "${playlistUrl}"`,
      { maxBuffer: 50 * 1024 * 1024, timeout: 120000 }
    );

    const lines = stdout.trim().split('\n').filter(Boolean);
    if (!lines.length) throw new Error('No videos found in playlist');

    const videos = lines.map(line => {
      const data = JSON.parse(line);
      return {
        youtubeId: data.id || data.url,
        title: data.title || 'Untitled',
        description: data.description || '',
        duration: data.duration_string || String(data.duration || ''),
        url: `https://www.youtube.com/watch?v=${data.id || data.url}`
      };
    });

    const firstEntry = JSON.parse(lines[0]);
    const playlistTitle = firstEntry.playlist_title || firstEntry.playlist || firstEntry.title || 'Untitled Playlist';

    return { title: playlistTitle, videos };
  } catch (err) {
    console.error('yt-dlp playlist error:', err.message);
    throw new Error('Failed to fetch playlist. Make sure the URL is a valid YouTube playlist.');
  }
}

/**
 * Get transcript for a single video using yt-dlp subtitles
 */
async function getVideoTranscript(videoId) {
  try {
    const cmd = await getYtDlpCmd();

    // Download subtitles to temp dir
    const tmpDir = require('os').tmpdir();
    const outTemplate = path.join(tmpDir, `edunova_${videoId}_%(ext)s`);

    await execAsync(
      `${cmd} --write-auto-sub --sub-lang en --sub-format json3 --skip-download --no-warnings -o "${outTemplate}" "https://www.youtube.com/watch?v=${videoId}"`,
      { maxBuffer: 10 * 1024 * 1024, timeout: 60000 }
    );

    // Look for downloaded subtitle file
    const fs = require('fs');
    const expectedFile = path.join(tmpDir, `edunova_${videoId}_en.json3`);
    const altFile      = path.join(tmpDir, `edunova_${videoId}.en.json3`);
    const subFile      = fs.existsSync(expectedFile) ? expectedFile : fs.existsSync(altFile) ? altFile : null;

    if (subFile) {
      try {
        const subData  = JSON.parse(fs.readFileSync(subFile, 'utf-8'));
        try { fs.unlinkSync(subFile); } catch {}
        if (subData.events) {
          return subData.events
            .filter(e => e.segs)
            .map(e => e.segs.map(s => s.utf8 || '').join(''))
            .join(' ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
      } catch {}
    }

    // Fallback: get description via --print-json
    const { stdout } = await execAsync(
      `${cmd} --dump-json --no-warnings --skip-download "https://www.youtube.com/watch?v=${videoId}"`,
      { maxBuffer: 5 * 1024 * 1024, timeout: 30000 }
    );
    const data = JSON.parse(stdout);
    return data.description || '';
  } catch (err) {
    console.error(`Transcript fetch failed for ${videoId}:`, err.message);
    return '';
  }
}

module.exports = { getPlaylistInfo, getVideoTranscript };
