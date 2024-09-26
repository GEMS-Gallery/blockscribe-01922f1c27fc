export const idlFactory = ({ IDL }) => {
  const Comment = IDL.Record({
    'content' : IDL.Text,
    'author' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const Post = IDL.Record({
    'title' : IDL.Text,
    'body' : IDL.Text,
    'author' : IDL.Text,
    'timestamp' : IDL.Int,
    'comments' : IDL.Vec(Comment),
  });
  return IDL.Service({
    'addComment' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text], [], []),
    'addPost' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [], []),
    'getPosts' : IDL.Func([], [IDL.Vec(Post)], ['query']),
    'init' : IDL.Func([], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
