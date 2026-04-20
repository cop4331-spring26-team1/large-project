class ThreadParticipant {
  final String id;
  final String name;
  final bool isVerifiedStudent;

  ThreadParticipant({required this.id, required this.name, this.isVerifiedStudent = false});

  factory ThreadParticipant.fromJson(Map<String, dynamic> json) => ThreadParticipant(
    id:                json['_id'] ?? '',
    name:              json['name'] ?? '',
    isVerifiedStudent: json['isVerifiedStudent'] ?? false,
  );
}

class ListingSnapshot {
  final String id;
  final String title;
  final double price;
  final String? mainImage;
  final String status;

  ListingSnapshot({
    required this.id,
    required this.title,
    required this.price,
    this.mainImage,
    required this.status,
  });

  factory ListingSnapshot.fromJson(Map<String, dynamic> json) => ListingSnapshot(
    id:        json['_id'] ?? '',
    title:     json['title'] ?? '',
    price:     (json['price'] ?? 0).toDouble(),
    mainImage: json['mainImage'],
    status:    json['status'] ?? 'active',
  );
}

class Thread {
  final String id;
  final List<ThreadParticipant> participants;
  final ListingSnapshot? listingSnapshot;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final bool isBlocked;

  Thread({
    required this.id,
    required this.participants,
    this.listingSnapshot,
    this.lastMessage,
    this.lastMessageAt,
    this.unreadCount = 0,
    this.isBlocked = false,
  });

  factory Thread.fromJson(Map<String, dynamic> json) => Thread(
    id:              json['_id'] ?? '',
    participants:    (json['participants'] as List? ?? [])
        .map((p) => ThreadParticipant.fromJson(p))
        .toList(),
    listingSnapshot: json['listingSnapshot'] != null
        ? ListingSnapshot.fromJson(json['listingSnapshot'])
        : null,
    lastMessage:    json['lastMessage'],
    lastMessageAt:  json['lastMessageAt'] != null
        ? DateTime.tryParse(json['lastMessageAt'])
        : null,
    unreadCount:    json['unreadCount'] ?? 0,
    isBlocked:      json['isBlocked'] ?? false,
  );

  Thread copyWith({int? unreadCount, bool? isBlocked, String? lastMessage, DateTime? lastMessageAt}) => Thread(
    id:              id,
    participants:    participants,
    listingSnapshot: listingSnapshot,
    lastMessage:     lastMessage ?? this.lastMessage,
    lastMessageAt:   lastMessageAt ?? this.lastMessageAt,
    unreadCount:     unreadCount ?? this.unreadCount,
    isBlocked:       isBlocked ?? this.isBlocked,
  );
}
