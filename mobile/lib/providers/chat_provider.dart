import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../models/thread.dart';
import '../models/message.dart';
import '../services/api_service.dart';

class ChatProvider extends ChangeNotifier {
  final _api = ApiService();
  IO.Socket? _socket;

  List<Thread>              _threads        = [];
  Map<String, List<Message>> _messages      = {};
  int                        _unread        = 0;
  bool                       _isLoading     = false;
  String?                    _activeThreadId;

  List<Thread> get threads   => _threads;
  int          get unread    => _unread;
  bool         get isLoading => _isLoading;

  List<Message> messagesFor(String threadId) => _messages[threadId] ?? [];

  Future<void> fetchThreads() async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await _api.get('/threads');
      final data = res.data['data'];
      _threads = (data['threads'] as List).map((e) => Thread.fromJson(e)).toList();
      _unread  = data['totalUnread'] ?? 0;
    } catch (_) {}
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchUnreadCount() async {
    try {
      final res = await _api.get('/threads/unread-count');
      _unread = res.data['data']['unreadCount'] ?? 0;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> openThread(String threadId) async {
    try {
      final res = await _api.get('/threads/$threadId/messages');
      _messages[threadId] = (res.data['data']['messages'] as List)
          .map((e) => Message.fromJson(e))
          .toList();
      // Clear unread for this thread
      final idx = _threads.indexWhere((t) => t.id == threadId);
      if (idx != -1) {
        _unread = (_unread - _threads[idx].unreadCount).clamp(0, 9999);
        _threads[idx] = _threads[idx].copyWith(unreadCount: 0);
      }
      notifyListeners();
      _socket?.emit('joinThread', threadId);
    } catch (_) {}
  }

  void setActiveThread(String? threadId) {
    _activeThreadId = threadId;
  }

  void closeThread(String threadId) {
    _activeThreadId = null;
    _socket?.emit('leaveThread', threadId);
  }

  Future<Message?> sendMessage(String threadId, String body) async {
    try {
      final res = await _api.post('/threads/$threadId/messages', data: {'body': body});
      final msg = Message.fromJson(res.data['data']['message']);
      _messages[threadId] = [...messagesFor(threadId), msg];
      notifyListeners();
      return msg;
    } catch (_) {
      return null;
    }
  }

  Future<Thread?> createThread(String listingId, {String message = 'Hi, I am interested in your listing!'}) async {
    try {
      final res = await _api.post('/threads', data: {'listingId': listingId, 'message': message});
      final thread = Thread.fromJson(res.data['data']['thread']);
      _threads.insert(0, thread);
      notifyListeners();
      return thread;
    } catch (e) {
      return null;
    }
  }

  Future<void> blockThread(String threadId) async {
    try {
      await _api.patch('/threads/$threadId/block');
      final idx = _threads.indexWhere((t) => t.id == threadId);
      if (idx != -1) {
        _threads[idx] = _threads[idx].copyWith(isBlocked: !_threads[idx].isBlocked);
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> deleteThread(String threadId) async {
    try {
      await _api.patch('/threads/$threadId/delete');
      _threads.removeWhere((t) => t.id == threadId);
      _messages.remove(threadId);
      notifyListeners();
    } catch (_) {}
  }

  void initSocketListeners({String? userId}) {
    if (_socket != null) return;
    const baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:5000');
    _socket = IO.io(baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'auth': {'userId': userId},
    });
    _socket!.on('newMessage', (data) {
      final threadId = data['threadId'] as String;
      final msg      = Message.fromJson(data['message']);
      _messages[threadId] = [...messagesFor(threadId), msg];
      final idx = _threads.indexWhere((t) => t.id == threadId);
      if (idx != -1) {
        _threads[idx] = _threads[idx].copyWith(
          lastMessage:   msg.body,
          lastMessageAt: msg.createdAt,
        );
      }
      // Only increment unread if user is not currently reading this thread
      if (_activeThreadId != threadId) {
        _unread++;
      }
      notifyListeners();
    });
  }

  void disconnectSocket() {
    _socket?.disconnect();
    _socket = null;
  }
}
