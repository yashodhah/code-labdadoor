export interface VcsProvider {
  getDiff(): Promise<string>;
  postReview(decision: string, body: string): Promise<void>;
  postComment(body: string): Promise<void>;
}
