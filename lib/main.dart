import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

void main() => runApp(const App());

class App extends StatelessWidget {
  const App({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true),
        home: const Home(),
      );
}

class Home extends StatefulWidget {
  const Home({super.key});
  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  List<String> paths = [];
  int current = 0;

  Future<void> pick() async {
    final r = await FilePicker.platform
        .pickFiles(type: FileType.video, allowMultiple: true);
    if (r == null) return;
    setState(() {
      paths = r.paths.whereType<String>().toList();
      current = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (paths.isEmpty) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('وقت التمرين',
                  style: TextStyle(fontSize: 40, fontWeight: FontWeight.w900)),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: pick,
                child: const Padding(
                  padding: EdgeInsets.all(12),
                  child: Text('اختار الفيديوهات',
                      style: TextStyle(fontSize: 20)),
                ),
              ),
            ],
          ),
        ),
      );
    }
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [
        PageView.builder(
          key: ValueKey(paths.join()),
          scrollDirection: Axis.vertical,
          itemCount: paths.length,
          onPageChanged: (i) => setState(() => current = i),
          itemBuilder: (_, i) =>
              VideoPage(path: paths[i], active: i == current),
        ),
        SafeArea(
          child: Align(
            alignment: Alignment.topLeft,
            child: IconButton(icon: const Icon(Icons.add), onPressed: pick),
          ),
        ),
      ]),
    );
  }
}

class VideoPage extends StatefulWidget {
  final String path;
  final bool active;
  const VideoPage({super.key, required this.path, required this.active});
  @override
  State<VideoPage> createState() => _VideoPageState();
}

class _VideoPageState extends State<VideoPage> {
  late final VideoPlayerController c;

  @override
  void initState() {
    super.initState();
    c = VideoPlayerController.file(File(widget.path));
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

  @override
  Widget build(BuildContext context) {
    if (!c.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }
    return GestureDetector(
      onTap: () => c.value.isPlaying ? c.pause() : c.play(),
      child: Stack(alignment: Alignment.center, children: [
        Center(
          child: AspectRatio(
              aspectRatio: c.value.aspectRatio, child: VideoPlayer(c)),
        ),
        if (!c.value.isPlaying)
          const Icon(Icons.play_arrow, size: 90, color: Colors.white70),
        Align(
          alignment: Alignment.bottomCenter,
          child: VideoProgressIndicator(c, allowScrubbing: true),
        ),
      ]),
    );
  }
}
