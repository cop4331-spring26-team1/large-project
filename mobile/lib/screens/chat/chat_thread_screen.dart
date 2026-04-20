import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../config/app_theme.dart';
import '../../models/message.dart';
import '../../models/thread.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';

class ChatThreadScreen extends StatefulWidget {
  final String threadId;
  final Thread? thread;

  const ChatThreadScreen({
    super.key,
    required this.threadId,
    this.thread,
  });

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isSending = false;
  ChatProvider? _chatProvider;

  int _prevMessageCount = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      _chatProvider = context.read<ChatProvider>();
      _chatProvider!.setActiveThread(widget.threadId);
      _chatProvider!.addListener(_onChatUpdate);
      await _chatProvider!.openThread(widget.threadId);
      _scrollToBottom();
    });
  }

  void _onChatUpdate() {
    final chat = context.read<ChatProvider>();
    final count = chat.messagesFor(widget.threadId).length;
    if (count > _prevMessageCount) {
      _prevMessageCount = count;
      _scrollToBottom();
    }
  }

  @override
  void dispose() {
    _chatProvider
      ?..removeListener(_onChatUpdate)
      ..closeThread(widget.threadId);
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    setState(() => _isSending = true);

    final msg =
        await context.read<ChatProvider>().sendMessage(widget.threadId, text);

    setState(() => _isSending = false);

    if (msg != null) {
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    final chat = context.watch<ChatProvider>();
    final auth = context.read<AuthProvider>();
    final messages = chat.messagesFor(widget.threadId);
    final userId = auth.user?.id ?? '';

    // Use live thread from provider for up-to-date isBlocked state
    final liveThread = chat.threads.firstWhere(
      (t) => t.id == widget.threadId,
      orElse: () => widget.thread ?? Thread(id: widget.threadId, participants: [], unreadCount: 0),
    );
    final isBlocked = liveThread.isBlocked;

    String title = 'Chat';
    final other = liveThread.participants.firstWhere(
      (p) => p.id != userId,
      orElse: () => liveThread.participants.isNotEmpty
          ? liveThread.participants[0]
          : ThreadParticipant(id: '', name: ''),
    );
    if (other.name.isNotEmpty) title = other.name;

    return Scaffold(
      backgroundColor: AppTheme.bgDark,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w600)),
            if (liveThread.listingSnapshot != null)
              Text(
                '\$${liveThread.listingSnapshot!.price.toStringAsFixed(0)}/mo • ${liveThread.listingSnapshot!.title}',
                style: const TextStyle(
                    fontSize: 11, color: AppTheme.textSecondary),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded, color: AppTheme.textPrimary),
            onSelected: (val) async {
              if (val == 'block') {
                await chat.blockThread(widget.threadId);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(isBlocked ? 'Conversation unblocked' : 'Conversation blocked')),
                  );
                }
              }
              if (val == 'delete') {
                showDialog(
                  context: context,
                  builder: (_) => AlertDialog(
                    title: const Text('Delete conversation?'),
                    content: const Text('This will remove the conversation from your inbox.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(context);
                          chat.deleteThread(widget.threadId);
                          Navigator.pop(context);
                        },
                        style: TextButton.styleFrom(foregroundColor: AppTheme.error),
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                );
              }
            },
            itemBuilder: (_) => [
              PopupMenuItem(
                value: 'block',
                child: Row(children: [
                  Icon(Icons.block_rounded, size: 18, color: isBlocked ? AppTheme.error : AppTheme.warning),
                  const SizedBox(width: 10),
                  Text(isBlocked ? 'Unblock conversation' : 'Block conversation'),
                ]),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(children: [
                  Icon(Icons.delete_outline_rounded, size: 18, color: AppTheme.error),
                  SizedBox(width: 10),
                  Text('Delete conversation', style: TextStyle(color: AppTheme.error)),
                ]),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Blocked banner
          if (isBlocked)
            Container(
              width: double.infinity,
              color: AppTheme.error.withValues(alpha: 0.12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: const Row(children: [
                Icon(Icons.block_rounded, size: 16, color: AppTheme.error),
                SizedBox(width: 8),
                Expanded(
                  child: Text('This conversation is blocked — no new messages can be sent.',
                      style: TextStyle(fontSize: 13, color: AppTheme.error)),
                ),
              ]),
            ),

          // Messages
          Expanded(
            child: messages.isEmpty
                ? const Center(
                    child: Text('No messages yet. Say hello!',
                        style: TextStyle(color: AppTheme.textSecondary)),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    itemCount: messages.length,
                    itemBuilder: (_, i) {
                      final msg = messages[i];
                      final isMe = msg.sender.id == userId;
                      final showDate = i == 0 ||
                          messages[i - 1]
                                  .createdAt
                                  .difference(msg.createdAt)
                                  .abs()
                                  .inMinutes >
                              10;
                      return Column(
                        children: [
                          if (showDate)
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 12),
                              child: Text(
                                _formatDate(msg.createdAt),
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.textLight),
                              ),
                            ),
                          _MessageBubble(message: msg, isMe: isMe),
                        ],
                      );
                    },
                  ),
          ),

          // Input
          Container(
            color: AppTheme.bgCard,
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 10,
              bottom: MediaQuery.of(context).padding.bottom + 10,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 120),
                    decoration: BoxDecoration(
                      color: isBlocked ? AppTheme.bgElevated : AppTheme.bgInput,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: TextField(
                      controller: _messageController,
                      enabled: !isBlocked,
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      style: const TextStyle(fontSize: 15, color: AppTheme.textPrimary),
                      decoration: InputDecoration(
                        hintText: isBlocked ? 'Conversation blocked' : 'Message...',
                        border: InputBorder.none,
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        hintStyle: const TextStyle(color: AppTheme.textLight),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: (_isSending || isBlocked) ? null : _send,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: isBlocked ? AppTheme.textLight : AppTheme.primary,
                      shape: BoxShape.circle,
                    ),
                    child: _isSending
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.send_rounded,
                            color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    if (dt.year == now.year && dt.month == now.month && dt.day == now.day) {
      return 'Today ${DateFormat.jm().format(dt)}';
    }
    if (dt.year == now.year &&
        dt.month == now.month &&
        dt.day == now.day - 1) {
      return 'Yesterday ${DateFormat.jm().format(dt)}';
    }
    return DateFormat('MMM d, h:mm a').format(dt);
  }
}

class _MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMe;

  const _MessageBubble({required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: 4,
          left: isMe ? 60 : 0,
          right: isMe ? 0 : 60,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMe ? AppTheme.primary : AppTheme.bgCard,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isMe ? 18 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 18),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              message.body,
              style: TextStyle(
                fontSize: 15,
                color: isMe ? Colors.white : AppTheme.textPrimary,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              DateFormat.jm().format(message.createdAt),
              style: TextStyle(
                fontSize: 10,
                color: isMe
                    ? Colors.white.withOpacity(0.7)
                    : AppTheme.textLight,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
