export default function printTree() {
  return (tree) => {
    console.dir(tree, { depth: null })
  }
}
