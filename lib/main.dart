import 'dart:async';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:video_player/video_player.dart';
import 'games.dart';

const keys = ['quran', 'anasheed', 'taaleem', 'other'];
const labels = ['قرآن', 'أناشيد', 'تعليم', 'فيديوهات أخرى', 'ألعاب'];
const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

void main() => runApp(const App());

class App extends StatelessWidget {
  const App({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true),
        home: const Splash(),
      );
}

class Splash extends StatefulWidget {
  const Splash({super.key});
  @override
  State<Splash> createState() => _SplashState();
}

class _SplashState extends State<Splash> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 500),
        () => say('راكان', pitch: 1.2, rate: 0.3));
    Timer(const Duration(milliseconds: 3200), () {
      if (!mounted) return;
      Navigator.pushReplacement(
          context, MaterialPageRoute(builder: (_) => const Home()));
    });
  }

  @override
  Widget build(BuildContext context) => const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Text('راكان',
              style: TextStyle(
                  fontSize: 80,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFFFB300))),
        ),
      );
}

class Home extends StatefulWidget {
  const Home({super.key});
  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  List<File> videos = [];
  int sec = 0;
  int current = 0;
  bool busy = true;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<Directory> folder() async {
    final base = await getApplicationDocumentsDirectory();
    final dir = Directory('${base.path}/videos/${keys[sec]}');
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }

  Future<void> load() async {
    if (sec > 3) {
      setState(() => busy = false);
      return;
    }
    final dir = await folder();
    final list = dir.listSync().whereType<File>().toList()
      ..sort((a, b) => a.path.compareTo(b.path));
    if (!mounted) return;
    setState(() {
      videos = list;
      current = 0;
      busy = false;
    });
  }

  Future<void> pick() async {
    final r = await FilePicker.platform
        .pickFiles(type: FileType.video, allowMultiple: true);
    if (r == null) return;
    setState(() => busy = true);
    final dir = await folder();
    for (final p in r.paths.whereType<String>()) {
      final name = p.split('/').last;
      final id = DateTime.now().microsecondsSinceEpoch;
      await File(p).copy('${dir.path}/${id}_$name');
    }
    await load();
  }

  Future<void> remove() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('مسح الفيديو ده؟'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(c, false),
              child: const Text('لا')),
          TextButton(
              onPressed: () => Navigator.pop(c, true),
              child: const Text('امسح')),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => busy = true);
    await videos[current].delete();
    await load();
  }

  Widget body() {
    if (sec > 3) return const GamesMenu();
    if (busy) return const Center(child: CircularProgressIndicator());
    if (videos.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('قسم ${labels[sec]} فاضي',
                style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 16),
            FilledButton(
                onPressed: pick, child: const Text('إضافة فيديوهات')),
          ],
        ),
      );
    }
    return PageView.builder(
      key: ValueKey('$sec${videos.map((f) => f.path).join()}'),
      scrollDirection: Axis.vertical,
      itemCount: videos.length,
      onPageChanged: (i) => setState(() => current = i),
      itemBuilder: (_, i) => VideoPage(file: videos[i], active: i == current),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 4, 0),
            child: Row(children: [
              const Text('Rakan',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900)),
              const Spacer(),
              if (sec < 4)
                IconButton(icon: const Icon(Icons.add), onPressed: pick),
              if (sec < 4 && videos.isNotEmpty)
                IconButton(
                    icon: const Icon(Icons.delete_outline), onPressed: remove),
            ]),
          ),
          Directionality(
            textDirection: TextDirection.rtl,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(children: [
                for (var i = 0; i < labels.length; i++)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: ChoiceChip(
                      label: Text(labels[i]),
                      selected: sec == i,
                      onSelected: (_) {
                        if (sec == i) return;
                        setState(() {
                          sec = i;
                          busy = i < 4;
                        });
                        load();
                      },
                    ),
                  ),
              ]),
            ),
          ),
          Expanded(child: body()),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 4),
            child: Text('created by mohamed shalby',
                style: TextStyle(fontSize: 11, color: Colors.white38)),
          ),
        ]),
      ),
    );
  }
}

class VideoPage extends StatefulWidget {
  final File file;
  final bool active;
  const VideoPage({super.key, required this.file, required this.active});
  @override
  State<VideoPage> createState() => _VideoPageState();
}

class _VideoPageState extends State<VideoPage> {
  late final VideoPlayerController c;
  int speedIdx = 2;

  @override
  void initState() {
    super.initState();
    c = VideoPlayerController.file(widget.file);
    c.addListener(() {
      if (mounted) setState(() {});
    });
    c.setLooping(true);
    c.initialize().then((_) {
      if (mounted && widget.active) c.play();
    });
  }

  @override
  void didUpdateWidget(VideoPage old) {
    super.didUpdateWidget(old);
    if (widget.active != old.active && c.value.isInitialized) {
      widget.active ? c.play() : c.pause();
    }
  }

  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  Future<void> seek(int s) async {
    final p = await c.position ?? Duration.zero;
    var t = p + Duration(seconds: s);
    if (t < Duration.zero) t = Duration.zero;
    if (t > c.value.duration) t = c.value.duration;
    await c.seekTo(t);
  }

  void changeSpeed(int d) {
    final i = (speedIdx + d).clamp(0, speeds.length - 1);
    setState(() => speedIdx = i);
    c.setPlaybackSpeed(speeds[i]);
  }

  @override
  Widget build(BuildContext context) {
    if (!c.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }
    final playing = c.value.isPlaying;
    return Stack(alignment: Alignment.center, children: [
      Center(
        child: AspectRatio(
            aspectRatio: c.value.aspectRatio, child: VideoPlayer(c)),
      ),
      IconButton(
        iconSize: 84,
        color: playing ? Colors.white24 : Colors.white70,
        icon: Icon(playing ? Icons.pause_circle : Icons.play_circle),
        onPressed: () => playing ? c.pause() : c.play(),
      ),
      Positioned(
        left: 0,
        right: 0,
        bottom: 20,
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          IconButton(
              iconSize: 34,
              icon: const Icon(Icons.replay_10),
              onPressed: () => seek(-10)),
          IconButton(
              icon: const Icon(Icons.remove_circle_outline),
              onPressed: () => changeSpeed(-1)),
          SizedBox(
            width: 56,
            child: Text('${speeds[speedIdx]}x',
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
          IconButton(
              icon: const Icon(Icons.add_circle_outline),
              onPressed: () => changeSpeed(1)),
          IconButton(
              iconSize: 34,
              icon: const Icon(Icons.forward_10),
              onPressed: () => seek(10)),
        ]),
      ),
      Align(
        alignment: Alignment.bottomCenter,
        child: VideoProgressIndicator(c, allowScrubbing: true),
      ),
    ]);
  }
}
