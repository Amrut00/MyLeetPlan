import { HiOutlineLightBulb } from 'react-icons/hi2';

function QuickTips({ topic }) {
  // Topic-specific tips
  const topicTips = {
    'Arrays & Hashing': [
      {
        title: "Hash Maps are Key",
        tip: "Use hash maps (objects/dictionaries) to track frequencies, indices, or seen elements. O(1) lookups make many array problems efficient."
      },
      {
        title: "Two Pass Strategy",
        tip: "Sometimes you need two passes: first to collect data (counts, indices), second to process or find the answer."
      },
      {
        title: "Prefix Sums",
        tip: "For subarray sum problems, consider prefix sums. They help calculate range sums in O(1) time."
      },
      {
        title: "Set for Uniqueness",
        tip: "Use sets to check for duplicates or unique elements. Much faster than nested loops for membership checks."
      }
    ],
    'Two Pointers': [
      {
        title: "Start from Ends",
        tip: "For sorted arrays, start pointers at both ends. Move them based on comparison - one moves left, one moves right."
      },
      {
        title: "Fast & Slow",
        tip: "For linked lists, use fast and slow pointers. Fast moves 2 steps, slow moves 1 - great for finding middle or cycles."
      },
      {
        title: "Same Direction",
        tip: "When both pointers move in the same direction, you're essentially doing a sliding window. Track the window state."
      },
      {
        title: "Skip Duplicates",
        tip: "When dealing with duplicates, skip them by moving pointers past all duplicate values to avoid duplicate results."
      }
    ],
    'Sliding Window': [
      {
        title: "Fixed vs Dynamic",
        tip: "Fixed window: maintain exact size. Dynamic window: expand/contract based on condition (usually sum or unique chars)."
      },
      {
        title: "Expand Right, Contract Left",
        tip: "Expand window by moving right pointer, contract by moving left. Track window state (sum, char count) as you go."
      },
      {
        title: "Hash Map for Tracking",
        tip: "Use hash maps to track character frequencies or element counts within the window for efficient updates."
      },
      {
        title: "Minimum/Maximum Windows",
        tip: "For minimum window: expand until valid, then contract to find minimum. For maximum: expand as much as possible."
      }
    ],
    'Binary Search': [
      {
        title: "Not Just Arrays",
        tip: "Binary search works on any sorted data structure. Also use it for finding answers in a search space (like finding minimum/maximum)."
      },
      {
        title: "Left vs Right Bias",
        tip: "Use left = mid + 1 when you want the rightmost valid answer. Use right = mid when you want the leftmost valid answer."
      },
      {
        title: "Search Space",
        tip: "Sometimes the search space isn't the array itself, but a range of possible answers. Binary search on the answer!"
      },
      {
        title: "Rotated Arrays",
        tip: "For rotated sorted arrays, check which half is sorted. The target must be in the sorted half or the other half."
      }
    ],
    'Stacks': [
      {
        title: "LIFO Principle",
        tip: "Stacks are Last In First Out. Perfect for problems involving matching pairs, reversing order, or tracking nested structures."
      },
      {
        title: "Monotonic Stacks",
        tip: "Use monotonic stacks (always increasing/decreasing) to find next/previous greater/smaller elements efficiently."
      },
      {
        title: "Parentheses Matching",
        tip: "Push opening brackets, pop when you see matching closing bracket. Stack should be empty at the end for valid strings."
      },
      {
        title: "Expression Evaluation",
        tip: "Use two stacks: one for numbers, one for operators. Process based on operator precedence."
      }
    ],
    'Trees (Basics)': [
      {
        title: "Recursive Thinking",
        tip: "Trees are naturally recursive. Solve for left and right subtrees, then combine results. Base case: null node."
      },
      {
        title: "Traversal Orders",
        tip: "Inorder: left-root-right (gives sorted order for BST). Preorder: root-left-right. Postorder: left-right-root."
      },
      {
        title: "Depth vs Height",
        tip: "Depth: distance from root. Height: distance to deepest leaf. Calculate height recursively: 1 + max(left, right)."
      },
      {
        title: "Null Checks First",
        tip: "Always check if node is null before accessing its properties. This is your base case in recursive solutions."
      }
    ],
    'Linked Lists': [
      {
        title: "Dummy Head",
        tip: "Use a dummy head node to simplify edge cases when modifying the list. Prevents special handling for head changes."
      },
      {
        title: "Two Pointers",
        tip: "Fast and slow pointers: find middle (fast at end, slow at middle), detect cycles (fast catches slow if cycle exists)."
      },
      {
        title: "Reverse in Place",
        tip: "To reverse: keep prev, curr, next. Set curr.next = prev, then move all three forward. Start with prev = null."
      },
      {
        title: "Handle Edge Cases",
        tip: "Check for empty list, single node, and two nodes. These often need special handling in linked list problems."
      }
    ],
    'Recursion': [
      {
        title: "Base Case First",
        tip: "Always define your base case(s) first - when to stop recursing. Usually when input is empty, null, or reaches a boundary."
      },
      {
        title: "Trust the Recursion",
        tip: "Assume the recursive call works correctly for smaller inputs. Focus on how to combine results, not the recursion itself."
      },
      {
        title: "Call Stack Visualization",
        tip: "Draw the call stack to understand execution order. Each recursive call adds a frame, returns pop frames."
      },
      {
        title: "Tail Recursion",
        tip: "When the recursive call is the last operation, it's tail recursion. Can be optimized to iterative solution."
      }
    ],
    'Backtracking': [
      {
        title: "Try, Recurse, Undo",
        tip: "Backtracking pattern: make a choice, recurse, then undo the choice. This explores all possibilities systematically."
      },
      {
        title: "State Restoration",
        tip: "After backtracking, restore the state to what it was before. This allows exploring other paths from the same state."
      },
      {
        title: "Pruning",
        tip: "Skip branches that can't lead to valid solutions. Check constraints early to avoid unnecessary recursion."
      },
      {
        title: "Base Case = Solution",
        tip: "Base case usually means you've built a complete solution. Add it to results, then backtrack to find more."
      }
    ],
    'DFS': [
      {
        title: "Stack or Recursion",
        tip: "DFS can be implemented recursively (simpler) or iteratively with a stack. Both visit nodes in depth-first order."
      },
      {
        title: "Mark Visited",
        tip: "For graphs, mark nodes as visited to avoid cycles. Use a visited set or mark in-place for trees/grids."
      },
      {
        title: "Path Tracking",
        tip: "Pass current path as parameter. Add node when entering, remove when backtracking. This tracks the path naturally."
      },
      {
        title: "Pre/In/Post Processing",
        tip: "Process node before children (pre), between (in), or after (post). Choose based on what you need to compute."
      }
    ],
    'Graphs': [
      {
        title: "Adjacency List",
        tip: "Use adjacency list (map of node to neighbors) for most graph problems. More space-efficient than adjacency matrix."
      },
      {
        title: "BFS for Shortest Path",
        tip: "BFS finds shortest unweighted paths. Use queue, mark visited, process level by level. First time you reach target = shortest."
      },
      {
        title: "DFS for Connectivity",
        tip: "DFS explores all connected nodes. Use it to find connected components, detect cycles, or traverse all reachable nodes."
      },
      {
        title: "Topological Sort",
        tip: "For DAGs, use DFS with post-order processing or Kahn's algorithm (BFS-based) to get topological ordering."
      }
    ],
    'Strings': [
      {
        title: "Character Frequency",
        tip: "Use hash maps to count character frequencies. Essential for anagrams, palindromes, and character replacement problems."
      },
      {
        title: "Two Pointers",
        tip: "Use two pointers for palindrome checks, reversing, or comparing strings. Start from both ends and move inward."
      },
      {
        title: "String Building",
        tip: "Use array to build strings (push characters), then join. Much faster than string concatenation in loops."
      },
      {
        title: "Sliding Window",
        tip: "For substring problems, use sliding window. Track character counts in window, expand/contract based on conditions."
      }
    ],
    'Heaps (Priority Queue)': [
      {
        title: "Min vs Max Heap",
        tip: "Min heap: smallest element at top. Max heap: largest at top. Use for finding kth largest/smallest elements."
      },
      {
        title: "K-Sized Heap",
        tip: "Maintain heap of size k. For kth largest: use min heap. For kth smallest: use max heap. Pop when size > k."
      },
      {
        title: "Merge K Sorted",
        tip: "Use min heap with first element from each list. Pop smallest, add next from that list. Repeat until heap empty."
      },
      {
        title: "Frequency + Heap",
        tip: "Combine frequency counting with heaps to find top k frequent elements. Count frequencies, then heapify by frequency."
      }
    ],
    'Greedy': [
      {
        title: "Local Optimal Choice",
        tip: "Greedy: make the locally optimal choice at each step. If this leads to global optimum, greedy works. Otherwise, need DP."
      },
      {
        title: "Sort First",
        tip: "Many greedy problems require sorting first. Sort by end time (intervals), value/weight ratio (knapsack), or other criteria."
      },
      {
        title: "Prove Greedy Choice",
        tip: "Greedy works when: 1) optimal solution contains greedy choice, 2) subproblem after choice is similar. Think about this."
      },
      {
        title: "Activity Selection",
        tip: "Classic greedy: always pick activity with earliest end time that doesn't conflict. This maximizes number of activities."
      }
    ]
  };

  // General tips as fallback
  const generalTips = [
    {
      title: "Read Carefully",
      tip: "Read the problem statement at least twice. Identify constraints, edge cases, and expected output format."
    },
    {
      title: "Think Before Coding",
      tip: "Spend 5-10 minutes thinking about the approach before writing code. Draw examples, identify patterns."
    },
    {
      title: "Start Simple",
      tip: "Begin with a brute force solution, then optimize. It's better to have a working solution first."
    },
    {
      title: "Test Edge Cases",
      tip: "Always test with empty inputs, single elements, duplicates, and boundary values."
    }
  ];

  // Get tips for the topic, or use general tips
  const getTipsForTopic = (topicName) => {
    if (!topicName) return generalTips;
    
    // Try to find matching topic (case-insensitive, partial match)
    const topicKey = Object.keys(topicTips).find(
      key => key.toLowerCase().includes(topicName.toLowerCase()) || 
             topicName.toLowerCase().includes(key.toLowerCase())
    );
    
    return topicKey ? topicTips[topicKey] : generalTips;
  };

  const availableTips = getTipsForTopic(topic);

  // Use the day of year to get a different tip each day
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));
  const todayTip = availableTips[dayOfYear % availableTips.length];

  return (
    <div className="bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-teal-900/20 rounded-lg p-3 border border-blue-700/30 shadow-sm">
      <h3 className="text-sm font-semibold text-dark-text mb-2 flex items-center gap-1.5">
        <HiOutlineLightBulb className="w-4 h-4 text-yellow-400" />
        <span>Quick Tip{topic ? ` - ${topic}` : ''}</span>
      </h3>
      <div>
        <h4 className="text-xs font-semibold text-blue-300 mb-1.5">
          {todayTip.title}
        </h4>
        <p className="text-xs text-dark-text-secondary leading-relaxed">
          {todayTip.tip}
        </p>
      </div>
    </div>
  );
}

export default QuickTips;

