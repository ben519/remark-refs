import { visit } from "unist-util-visit"

const nodeTest = (node) => {
  return Object.hasOwn(node, "url")
}

export default function remarkFiles(options = { authorId, filesMap }) {
  // This plugin handles local, author-owned file references
  // It does two things:
  // 1. Convert filename references like "cat.png" to their fully qualified URL
  // 2. Identify and store all local, author-owned file references in the VFile
  //    The array stores file names like "cat.png", "dog.png", ...
  // filesMap should be an object that maps filenames to urls, like { "cat.png": "http://...", ...}

  const { authorId, filesMap } = options

  const re = new RegExp(
    `users/${authorId}/files/([^/]+?\.(?:png|jpg|jpeg|gif|svg|mp4|mov))`,
    "i"
  )

  return (tree, file) => {
    const bodyRefs = {}

    // Find existing images
    visit(tree, nodeTest, (node) => {
      // Example data
      // filesMap: {
      //   MyImage.png: "http://127.0.0.1:9199/storage/v1/b/scipress.appspot.com/o/users%2Ft0uf0h%2Ffiles%2FMyImage.png?alt=...",
      //   test.png: "http://127.0.0.1:9199/storage/v1/b/scipress-dev.appspot.com/o/users%2Ft0GSgGYNFw1arWmsyWuRwoFYuf0..."
      // }

      let match = filesMap[node.url]
      if (match) {
        bodyRefs[node.url] = match
        node.url = match
      } else {
        match = re.exec(decodeURIComponent(node.url))
        if (match) {
          const filename = match[1]
          const url = filesMap[filename]
          if (url) {
            bodyRefs[filename] = url
          } else {
            console.log(
              "WARNING: A user-uploaded file was found in the body but its corresponding key in filesMap is missing."
            )
          }
        }
      }

      // If this is a video file, change hName from image to video
      if (/\.(mp4|mov)\??/i.test(node.url)) {
        node["data"] = {
          ...node.data,
          hName: "video",
          hProperties: { ...(node.data?.hProperties || {}), controls: true },
        }
      }
    })

    // Save to file.data
    file.data["bodyFilesMap"] = bodyRefs
  }
}
