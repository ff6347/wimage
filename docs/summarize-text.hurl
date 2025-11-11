# Summarize Text API Tests
# Tests the /api/summarize-text endpoint that uses OpenAI to summarize Wikipedia articles

### Test 1: Summarize single article
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": [
    {
      "title": "JavaScript",
      "text": "JavaScript is a high-level, often just-in-time compiled language that conforms to the ECMAScript standard. It has dynamic typing, prototype-based object-orientation, and first-class functions. It is multi-paradigm, supporting event-driven, functional, and imperative programming styles. It has application programming interfaces for working with text, dates, regular expressions, standard data structures, and the Document Object Model."
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" isCollection
jsonpath "$.results" count == 1
jsonpath "$.results[0].title" == "JavaScript"
jsonpath "$.results[0].summary" exists


### Test 2: Summarize multiple articles
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": [
    {
      "title": "JavaScript",
      "text": "JavaScript is a high-level, often just-in-time compiled language that conforms to the ECMAScript standard. It has dynamic typing, prototype-based object-orientation, and first-class functions. It is multi-paradigm, supporting event-driven, functional, and imperative programming styles."
    },
    {
      "title": "Python",
      "text": "Python is an interpreted, high-level, general-purpose programming language. Created by Guido van Rossum and first released in 1991, Python's design philosophy emphasizes code readability with its notable use of significant whitespace. Its language constructs and object-oriented approach aim to help programmers write clear, logical code for small and large-scale projects."
    },
    {
      "title": "Rust",
      "text": "Rust is a multi-paradigm programming language designed for performance and safety, especially safe concurrency. Rust is syntactically similar to C++, but can guarantee memory safety by using a borrow checker to validate references. Rust achieves memory safety without garbage collection, and reference counting is optional."
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" count == 3
jsonpath "$.results[0].title" == "JavaScript"
jsonpath "$.results[0].summary" exists
jsonpath "$.results[1].title" == "Python"
jsonpath "$.results[1].summary" exists
jsonpath "$.results[2].title" == "Rust"
jsonpath "$.results[2].summary" exists


### Test 3: Summarize long article
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": [
    {
      "title": "Machine Learning",
      "text": "Machine learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention. Machine learning algorithms are trained on data sets that contain examples. The more examples provided, the better the algorithm becomes at processing new data. Deep learning is a subset of machine learning that uses neural networks with multiple layers. These algorithms attempt to model high-level abstractions in data by using multiple processing layers with complex structures. Machine learning has applications in computer vision, natural language processing, email filtering, agriculture, and medicine, where it is difficult to develop conventional algorithms."
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results[0].summary" exists


### Test 4: Article with missing text
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": [
    {
      "title": "Test Article",
      "text": ""
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results[0].error" exists


### Test 5: Article with missing title
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": [
    {
      "text": "Some text content"
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results[0].error" exists


### Test 6: Mixed valid and invalid articles
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": [
    {
      "title": "JavaScript",
      "text": "JavaScript is a high-level programming language."
    },
    {
      "title": "Invalid",
      "text": ""
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.results" count == 2
jsonpath "$.results[0].summary" exists
jsonpath "$.results[1].error" exists


### Test 7: Error - empty articles array
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": []
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid articles provided"


### Test 8: Error - missing articles field
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid articles provided"


### Test 9: Error - non-array articles
POST http://localhost:4321/api/summarize-text
Content-Type: application/json

{
  "articles": "not an array"
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid articles provided"
