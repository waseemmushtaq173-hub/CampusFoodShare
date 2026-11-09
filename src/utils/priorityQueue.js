/**
 * src/utils/priorityQueue.js
 * Binary Min-Heap Priority Queue for ranking surplus food listings.
 * Ranks listings primarily by soonest expiry time and secondarily by nearest distance.
 */

class ListingPriorityQueue {
  constructor(comparator) {
    this.heap = [];
    // Default comparator: lower urgencyScore comes first (soonest expiry + closest distance)
    this.compare =
      comparator ||
      ((a, b) => {
        if (a.urgencyScore !== b.urgencyScore) {
          return a.urgencyScore - b.urgencyScore;
        }
        return new Date(a.useBefore) - new Date(b.useBefore);
      });
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap[0] || null;
  }

  enqueue(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.isEmpty()) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (!this.isEmpty()) {
      this.heap[0] = bottom;
      this._sinkDown(0);
    }
    return top;
  }

  toSortedArray() {
    const clone = new ListingPriorityQueue(this.compare);
    clone.heap = [...this.heap];
    const result = [];
    while (!clone.isEmpty()) {
      result.push(clone.dequeue());
    }
    return result;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
    }
  }

  _sinkDown(index) {
    const length = this.heap.length;
    while (true) {
      let left = 2 * index + 1;
      let right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[index],
      ];
      index = smallest;
    }
  }
}

/**
 * Computes a combined urgency score for a listing based on time remaining until expiry
 * and Haversine distance from the NGO/Volunteer.
 */
function rankListingsForNGO(listings, ngoLat, ngoLng, calcDistanceFn) {
  const pq = new ListingPriorityQueue();
  const now = Date.now();

  for (const listing of listings) {
    const expiryMs = new Date(listing.useBefore).getTime();
    const minutesRemaining = Math.max(0, Math.round((expiryMs - now) / 60000));

    const distanceKm =
      ngoLat != null && ngoLng != null
        ? calcDistanceFn(
            Number(ngoLat),
            Number(ngoLng),
            Number(listing.location.lat),
            Number(listing.location.lng)
          )
        : 0;

    // Weighted urgency score: 65% expiry urgency (in hours) + 35% distance (in km)
    const hoursRemaining = minutesRemaining / 60;
    const urgencyScore = Number((hoursRemaining * 0.65 + distanceKm * 0.35).toFixed(3));

    pq.enqueue({
      ...listing,
      minutesRemaining,
      distanceKm,
      urgencyScore,
    });
  }

  return pq.toSortedArray();
}

module.exports = { ListingPriorityQueue, rankListingsForNGO };
