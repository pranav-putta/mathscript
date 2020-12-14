use std::mem::swap;

type Compare<T> = fn(a: &T, b: &T) -> i32;

const INIT_SIZE: usize = 8;

pub struct PriorityQueue<T: Clone> {
    pub backing: Vec<Option<T>>,
    func: Compare<T>,
    size: usize,
}

impl<T: Clone> PriorityQueue<T> {
    pub fn new(func: Compare<T>) -> Self {
        let mut backing = Vec::with_capacity(INIT_SIZE);
        backing.push(None);
        PriorityQueue { backing, func, size: 0 }
    }

    pub fn push(&mut self, data: T) {
        self.size += 1;
        self.backing.push(Some(data));
        self.up_heap(self.size);
    }

    pub fn pop(&mut self) -> Option<T> {
        if self.size > 0 {
            let data = self.backing[1].clone();
            self.backing[1] = self.backing[self.size].clone();
            self.backing[self.size] = None;
            self.size -= 1;
            self.down_heap(1);
            return data;
        }
        None
    }

    pub fn empty(&self) -> bool {
        return self.size == 0;
    }

    fn swap(&mut self, i: usize, j: usize) {
        let tmp = self.backing[i].clone();
        self.backing[i] = self.backing[j].clone();
        self.backing[j] = tmp;
    }

    pub fn down_heap(&mut self, i: usize) {
        let left = i * 2;
        let right = left + 1;

        let mut swap = left;
        let cmp = self.func;

        if right <= self.size {
            if let (Some(l), Some(r)) = (&self.backing[left], &self.backing[right]) {
                if cmp(r, l) < 0 {
                    swap = right;
                }
            }
        }

        if left <= self.size {
            if let (Some(ii), Some(s)) = (&self.backing[i], &self.backing[swap]) {
                if cmp(ii, s) > 0 {
                    self.swap(swap, i);
                    self.down_heap(swap);
                }
            }
        }
    }

    pub fn up_heap(&mut self, i: usize) {
        let parent = i / 2;
        let cmp = self.func;

        if let (Some(ii), Some(p)) = (&self.backing[i], &self.backing[parent]) {
            if parent != 0 && cmp(ii, p) < 0 {
                self.swap(i, parent);
                self.up_heap(parent);
            }
        }
    }
}