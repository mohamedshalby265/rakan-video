package com.rakan.app

import android.annotation.SuppressLint
import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import kotlin.concurrent.thread

class MainActivity : ComponentActivity() {

    private lateinit var web: WebView
    private var tts: TextToSpeech? = null
    private var ttsOk = false
    private var chooser: ValueCallback<Array<Uri>>? = null
    private var repin = false

    private val audioExt = listOf("mp3", "m4a", "ogg", "wav", "aac", "opus")

    private val root: File
        get() = File(Environment.getExternalStorageDirectory(), "Rakan")

    private val prefs by lazy { getSharedPreferences("rakan", Context.MODE_PRIVATE) }

    private val picker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        chooser?.onReceiveValue(if (uri != null) arrayOf(uri) else null)
        chooser = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Suppress("DEPRECATION")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        try {
            val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            am.setStreamVolume(
                AudioManager.STREAM_MUSIC,
                am.getStreamMaxVolume(AudioManager.STREAM_MUSIC),
                0
            )
        } catch (_: Exception) {
        }

        initTts(true)

        web = WebView(this)
        web.setBackgroundColor(0xFFBFE9FB.toInt())
        setContentView(web)

        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.settings.allowFileAccess = true
        web.settings.allowContentAccess = true
        web.settings.allowFileAccessFromFileURLs = true
        web.settings.allowUniversalAccessFromFileURLs = true

        web.addJavascriptInterface(Bridge(), "Rakan")
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                callback: ValueCallback<Array<Uri>>?,
                params: FileChooserParams?
            ): Boolean {
                chooser?.onReceiveValue(null)
                chooser = callback
                picker.launch("image/*")
                return true
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                js("window.rakanBack&&window.rakanBack()")
            }
        })

        if (hasAccess()) makeFolders()
        web.loadUrl("file:///android_asset/app/index.html")
    }

    override fun onResume() {
        super.onResume()
        if (repin) {
            repin = false
            try {
                startLockTask()
            } catch (_: Exception) {
            }
        }
        if (::web.isInitialized) {
            if (hasAccess()) makeFolders()
            js("window.onRakanPermissionResult&&window.onRakanPermissionResult()")
        }
    }

    override fun onDestroy() {
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (_: Exception) {
        }
        super.onDestroy()
    }

    // ---------- أدوات مساعدة ----------

    private fun js(code: String) {
        if (::web.isInitialized) web.evaluateJavascript(code, null)
    }

    private fun initTts(google: Boolean) {
        val listener = TextToSpeech.OnInitListener { status ->
            if (status == TextToSpeech.SUCCESS) {
                val r = tts?.setLanguage(Locale("ar"))
                ttsOk = r != null && r != TextToSpeech.LANG_MISSING_DATA &&
                    r != TextToSpeech.LANG_NOT_SUPPORTED
                tts?.setSpeechRate(0.85f)
                tts?.setPitch(1.25f)
                runOnUiThread { js("window.onRakanTts&&window.onRakanTts($ttsOk)") }
            } else if (google) {
                initTts(false)
            } else {
                ttsOk = false
            }
        }
        tts = if (google) {
            TextToSpeech(this, listener, "com.google.android.tts")
        } else {
            TextToSpeech(this, listener)
        }
    }

    private fun hasAccess(): Boolean =
        if (Build.VERSION.SDK_INT >= 30) {
            Environment.isExternalStorageManager()
        } else {
            checkSelfPermission(android.Manifest.permission.READ_EXTERNAL_STORAGE) ==
                PackageManager.PERMISSION_GRANTED
        }

    private fun unpin() {
        try {
            val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            if (am.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE) {
                stopLockTask()
                repin = true
            }
        } catch (_: Exception) {
        }
    }

    private fun safeStart(i: Intent) {
        try {
            startActivity(i)
        } catch (_: Exception) {
        }
    }

    private fun findSound(rel: String): File? {
        val base = File(root, rel)
        val dir = base.parentFile ?: return null
        val name = base.name
        val names = mutableListOf(name)
        if (name.isNotEmpty() && name.all { it.isDigit() }) {
            names.add(name.padStart(2, '0'))
            names.add(name.padStart(3, '0'))
        }
        for (n in names) {
            for (e in audioExt) {
                val f = File(dir, "$n.$e")
                if (f.isFile) return f
            }
        }
        return null
    }

    private fun makeFolders() {
        try {
            listOf("videos", "photos", "sounds/app", "sounds/quran").forEach {
                File(root, it).mkdirs()
            }
            listOf("mom", "dad").forEach { v ->
                listOf(
                    "letters/ar", "letters/en", "numbers", "manners",
                    "prayer", "animals", "fruits", "praise"
                ).forEach { File(root, "sounds/$v/$it").mkdirs() }
            }
            val readme = File(root, "sounds/اقرأني.txt")
            if (!readme.exists()) readme.writeText(README)
        } catch (_: Exception) {
        }
    }

    @Suppress("DEPRECATION")
    private fun currentCode(): Int {
        return try {
            val pi = packageManager.getPackageInfo(packageName, 0)
            if (Build.VERSION.SDK_INT >= 28) pi.longVersionCode.toInt() else pi.versionCode
        } catch (_: Exception) {
            0
        }
    }

    private class HttpErr(val code: Int) : Exception()

    private fun fetchLatest(owner: String, repo: String): Pair<Int, String?> {
        val c = URL("https://api.github.com/repos/$owner/$repo/releases/latest")
            .openConnection() as HttpURLConnection
        c.connectTimeout = 10000
        c.readTimeout = 10000
        c.setRequestProperty("Accept", "application/vnd.github+json")
        c.setRequestProperty("User-Agent", "Rakan")
        if (c.responseCode != 200) throw HttpErr(c.responseCode)
        val j = JSONObject(c.inputStream.bufferedReader().use { it.readText() })
        val num = j.optString("tag_name", "").filter { it.isDigit() }.toIntOrNull() ?: 0
        var apk: String? = null
        val assets = j.optJSONArray("assets")
        if (assets != null) {
            for (i in 0 until assets.length()) {
                val a = assets.getJSONObject(i)
                if (a.optString("name").endsWith(".apk")) {
                    apk = a.optString("browser_download_url")
                    break
                }
            }
        }
        return Pair(num, apk)
    }

    private fun dl(state: String, pct: Int) {
        val o = JSONObject().put("state", state).put("pct", pct)
        runOnUiThread {
            js("window.onRakanDownload&&window.onRakanDownload(${JSONObject.quote(o.toString())})")
        }
    }

    // ---------- الجسر مع الواجهة: window.Rakan ----------

    inner class Bridge {

        @JavascriptInterface
        fun rootPath(): String = root.absolutePath

        @JavascriptInterface
        fun folderPath(kind: String): String = File(root, kind).absolutePath

        @JavascriptInterface
        fun hasAccess(): Boolean = this@MainActivity.hasAccess()

        @JavascriptInterface
        fun requestAllFilesAccess() {
            runOnUiThread {
                unpin()
                try {
                    if (Build.VERSION.SDK_INT >= 30) {
                        startActivity(
                            Intent(
                                Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                                Uri.parse("package:$packageName")
                            )
                        )
                    } else {
                        requestPermissions(
                            arrayOf(
                                android.Manifest.permission.READ_EXTERNAL_STORAGE,
                                android.Manifest.permission.WRITE_EXTERNAL_STORAGE
                            ), 1
                        )
                    }
                } catch (_: Exception) {
                    safeStart(Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION))
                }
            }
        }

        @JavascriptInterface
        fun makeFolders() {
            this@MainActivity.makeFolders()
        }

        @JavascriptInterface
        fun listMedia(kind: String): String {
            val exts = if (kind == "photos") {
                setOf("jpg", "jpeg", "png", "webp", "gif")
            } else {
                setOf("mp4", "mkv", "mov", "webm", "3gp", "m4v")
            }
            val arr = JSONArray()
            try {
                File(root, kind).listFiles()
                    ?.filter { it.isFile && it.extension.lowercase() in exts }
                    ?.sortedBy { it.name.lowercase() }
                    ?.forEach {
                        arr.put(
                            JSONObject()
                                .put("url", Uri.fromFile(it).toString())
                                .put("title", it.nameWithoutExtension)
                        )
                    }
            } catch (_: Exception) {
            }
            return arr.toString()
        }

        @JavascriptInterface
        fun soundUrl(rel: String): String =
            findSound(rel)?.let { Uri.fromFile(it).toString() } ?: ""

        @JavascriptInterface
        fun countSounds(rel: String): Int =
            File(root, rel).listFiles()
                ?.count { it.isFile && it.extension.lowercase() in audioExt } ?: 0

        @JavascriptInterface
        fun ttsReady(): Boolean = ttsOk

        @JavascriptInterface
        fun speak(text: String, lang: String) {
            val t = tts ?: return
            try {
                t.language = if (lang == "en") Locale.US else Locale("ar")
                t.speak(text, TextToSpeech.QUEUE_FLUSH, null, "rk")
            } catch (_: Exception) {
            }
        }

        @JavascriptInterface
        fun stopSpeaking() {
            try {
                tts?.stop()
            } catch (_: Exception) {
            }
        }

        @JavascriptInterface
        fun getPrefs(): String = prefs.getString("p", "") ?: ""

        @JavascriptInterface
        fun setPrefs(json: String) {
            prefs.edit().putString("p", json).apply()
        }

        @JavascriptInterface
        fun versionName(): String = try {
            packageManager.getPackageInfo(packageName, 0).versionName ?: ""
        } catch (_: Exception) {
            ""
        }

        @JavascriptInterface
        fun openAppSettings() {
            runOnUiThread {
                unpin()
                safeStart(
                    Intent(
                        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:$packageName")
                    )
                )
            }
        }

        @JavascriptInterface
        fun openPinningSettings() {
            runOnUiThread {
                unpin()
                safeStart(Intent(Settings.ACTION_SECURITY_SETTINGS))
            }
        }

        @JavascriptInterface
        fun openUrl(u: String) {
            runOnUiThread {
                unpin()
                safeStart(Intent(Intent.ACTION_VIEW, Uri.parse(u)))
            }
        }

        @JavascriptInterface
        fun exitApp() {
            runOnUiThread {
                try {
                    stopLockTask()
                } catch (_: Exception) {
                }
                finishAffinity()
            }
        }

        @JavascriptInterface
        fun checkUpdate(owner: String, repo: String) {
            thread {
                val out = JSONObject()
                out.put("current", currentCode())
                out.put("url", "https://github.com/$owner/$repo/releases/latest")
                try {
                    out.put("latest", fetchLatest(owner, repo).first)
                } catch (e: HttpErr) {
                    out.put("latest", 0)
                    val priv = e.code == 404 || e.code == 403 || e.code == 401
                    out.put("error", if (priv) "private" else "net")
                } catch (e: Exception) {
                    out.put("latest", 0)
                    out.put("error", "net")
                }
                runOnUiThread {
                    js("window.onRakanUpdate&&window.onRakanUpdate(${JSONObject.quote(out.toString())})")
                }
            }
        }

        @JavascriptInterface
        fun installUpdate(owner: String, repo: String) {
            thread {
                try {
                    if (Build.VERSION.SDK_INT >= 26 && !packageManager.canRequestPackageInstalls()) {
                        dl("permission", 0)
                        runOnUiThread {
                            unpin()
                            safeStart(
                                Intent(
                                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                    Uri.parse("package:$packageName")
                                )
                            )
                        }
                        return@thread
                    }
                    val apk = fetchLatest(owner, repo).second ?: throw Exception("no apk")
                    val dir = File(cacheDir, "updates")
                    dir.mkdirs()
                    val f = File(dir, "Rakan.apk")
                    val c = URL(apk).openConnection() as HttpURLConnection
                    c.connectTimeout = 15000
                    c.readTimeout = 30000
                    c.setRequestProperty("User-Agent", "Rakan")
                    val total = c.contentLength.toLong()
                    var done = 0L
                    var last = -1
                    c.inputStream.use { ins ->
                        f.outputStream().use { outs ->
                            val buf = ByteArray(32768)
                            while (true) {
                                val n = ins.read(buf)
                                if (n < 0) break
                                outs.write(buf, 0, n)
                                done += n
                                if (total > 0) {
                                    val p = (done * 100 / total).toInt()
                                    if (p != last) {
                                        last = p
                                        dl("progress", p)
                                    }
                                }
                            }
                        }
                    }
                    val uri = FileProvider.getUriForFile(
                        this@MainActivity, "$packageName.fileprovider", f
                    )
                    runOnUiThread {
                        unpin()
                        val i = Intent(Intent.ACTION_VIEW)
                        i.setDataAndType(uri, "application/vnd.android.package-archive")
                        i.addFlags(
                            Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
                        )
                        safeStart(i)
                    }
                    dl("installing", 100)
                } catch (e: Exception) {
                    dl("error", 0)
                }
            }
        }
    }

    companion object {
        private const val README = """مجلدات راكان
==========
videos : حط هنا فيديوهات الطفل
photos : حط هنا الصور

sounds/mom و sounds/dad : تسجيلات ماما وبابا (mp3 أو m4a أو wav)
اسم الملف = رقمه. أمثلة:
  letters/ar/1.mp3   حرف الألف
  letters/en/1.mp3   حرف A
  numbers/1.mp3      الرقم 1
  manners/1.mp3      أول بطاقة أخلاق
  prayer/1.mp3       أول خطوة صلاة
  animals/1.mp3      أول حيوان
  fruits/1.mp3       أول أكلة
  praise/1.mp3       برافو   |   praise/2.mp3  حاول تاني

sounds/quran : سور قصيرة برقم السورة في المصحف: 001.mp3 الفاتحة، 112.mp3 الإخلاص ...
sounds/app/welcome.mp3 : صوت الترحيب لما التطبيق يفتح

أي ملف ناقص، التطبيق بيستخدم صوته المدمج مكانه.
"""
    }
}
