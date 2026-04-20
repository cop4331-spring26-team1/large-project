class ListingOwner {
  final String id;
  final String name;
  final bool isVerifiedStudent;

  ListingOwner({required this.id, required this.name, this.isVerifiedStudent = false});

  factory ListingOwner.fromJson(Map<String, dynamic> json) => ListingOwner(
    id:                json['_id'] ?? json['id'] ?? '',
    name:              json['name'] ?? '',
    isVerifiedStudent: json['isVerifiedStudent'] ?? false,
  );
}

class ListingCoordinates {
  final double lat;
  final double lng;
  ListingCoordinates({required this.lat, required this.lng});
}

class Listing {
  final String id;
  final String title;
  final String description;
  final double price;
  final String address;
  final String city;
  final String state;
  final int bedrooms;
  final bool petsAllowed;
  final bool utilitiesIncluded;
  final List<String> images;
  final String status;
  final ListingOwner? owner;
  final ListingCoordinates? coordinates;
  final String? university;
  final bool isBoosted;
  final DateTime createdAt;
  final int favoriteCount;

  Listing({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.address,
    required this.city,
    required this.state,
    required this.bedrooms,
    required this.petsAllowed,
    required this.utilitiesIncluded,
    required this.images,
    required this.status,
    this.owner,
    this.coordinates,
    this.university,
    this.isBoosted = false,
    required this.createdAt,
    this.favoriteCount = 0,
  });

  String  get mainImage         => images.isNotEmpty ? images.first : '';
  String  get universityOrEmpty => university ?? '';
  bool    get ownerVerified     => owner?.isVerifiedStudent ?? false;

  Listing copyWith({String? status}) => Listing(
    id: id, title: title, description: description, price: price,
    address: address, city: city, state: state, bedrooms: bedrooms,
    petsAllowed: petsAllowed, utilitiesIncluded: utilitiesIncluded,
    images: images, status: status ?? this.status, owner: owner,
    coordinates: coordinates, university: university, isBoosted: isBoosted,
    createdAt: createdAt, favoriteCount: favoriteCount,
  );
  double? get distanceToCampus  => null; // not available from API

  factory Listing.fromJson(Map<String, dynamic> json) {
    final ownerData = json['owner'];
    final loc       = json['coordinates'] ?? json['location'];
    ListingCoordinates? coords;
    if (loc != null && loc['coordinates'] is List) {
      final c = List<dynamic>.from(loc['coordinates']);
      if (c.length == 2 && (c[0] != 0 || c[1] != 0)) {
        coords = ListingCoordinates(lat: c[1].toDouble(), lng: c[0].toDouble());
      }
    }
    return Listing(
      id:                json['_id'] ?? json['id'] ?? '',
      title:             json['title'] ?? '',
      description:       json['description'] ?? '',
      price:             (json['price'] ?? 0).toDouble(),
      address:           json['address'] ?? '',
      city:              json['city'] ?? '',
      state:             json['state'] ?? '',
      bedrooms:          json['bedrooms'] ?? 1,
      petsAllowed:       json['petsAllowed'] ?? false,
      utilitiesIncluded: json['utilitiesIncluded'] ?? false,
      images:            List<String>.from(json['images'] ?? []),
      status:            json['status'] ?? 'active',
      owner:             ownerData is Map ? ListingOwner.fromJson(ownerData as Map<String, dynamic>) : null,
      coordinates:       coords,
      university:        json['university'],
      isBoosted:         json['isBoosted'] ?? false,
      createdAt:         DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      favoriteCount:     json['favoriteCount'] ?? 0,
    );
  }
}
