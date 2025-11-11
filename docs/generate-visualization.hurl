# Generate Visualization API Tests
# Tests the /api/generate-visualization endpoint that uses OpenAI to create expressive HTML pages

### Test 1: Generate visualization with single summary
POST http://localhost:4321/api/generate-visualization
Content-Type: application/json

{
  "summaries": [
    {
      "title": "JavaScript",
      "summary": "JavaScript is a high-level programming language that conforms to the ECMAScript standard. It supports multiple programming paradigms including event-driven, functional, and imperative styles."
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.html" exists
jsonpath "$.html" contains "<!DOCTYPE"
jsonpath "$.html" contains "<html"
jsonpath "$.html" contains "JavaScript"


### Test 2: Generate visualization with multiple summaries
POST http://localhost:4321/api/generate-visualization
Content-Type: application/json

{
  "summaries": [
    {
      "title": "JavaScript",
      "summary": "JavaScript is a high-level programming language. It supports multiple paradigms."
    },
    {
      "title": "Python",
      "summary": "Python is an interpreted language. It emphasizes code readability."
    },
    {
      "title": "Rust",
      "summary": "Rust is designed for performance and safety. It achieves memory safety without garbage collection."
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.html" exists
jsonpath "$.html" contains "JavaScript"
jsonpath "$.html" contains "Python"
jsonpath "$.html" contains "Rust"
jsonpath "$.html" contains "<style"


### Test 3: Generate visualization with long summaries
POST http://localhost:4321/api/generate-visualization
Content-Type: application/json

{
  "summaries": [
    {
      "title": "Machine Learning",
      "summary": "Machine learning is a method of data analysis that automates analytical model building through algorithms that learn from data. Deep learning is a subset that uses neural networks with multiple layers to model high-level abstractions in data."
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.html" exists


### Test 4: Error - empty summaries array
POST http://localhost:4321/api/generate-visualization
Content-Type: application/json

{
  "summaries": []
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid summaries provided"


### Test 5: Error - missing summaries field
POST http://localhost:4321/api/generate-visualization
Content-Type: application/json

{}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid summaries provided"


### Test 6: Error - non-array summaries
POST http://localhost:4321/api/generate-visualization
Content-Type: application/json

{
  "summaries": "not an array"
}

HTTP 400
[Asserts]
jsonpath "$.error" == "No valid summaries provided"


### Test 7: Generate with special characters in text
POST http://localhost:4321/api/generate-visualization
Content-Type: application/json

{
  "summaries": [
    {
      "title": "C++ Programming",
      "summary": "C++ is a general-purpose language with \"object-oriented\" features. It's used for system/software development & game programming."
    }
  ]
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.html" exists
jsonpath "$.html" contains "C++"
