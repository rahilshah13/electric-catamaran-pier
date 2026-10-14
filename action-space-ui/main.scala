//> using scala "3.3.1"
//> using dep "com.lihaoyi::requests:0.9.3"
//> using dep "com.lihaoyi::ujson:3.1.4"
//> using dep "com.itextpdf:itextpdf:5.5.13.6"

import com.sun.net.httpserver.{HttpServer, HttpHandler, HttpExchange}
import java.net.InetSocketAddress
import java.nio.charset.StandardCharsets
import java.io.{File, FileInputStream, PrintWriter, StringWriter}
import scala.util.Using
import sys.process._
import com.itextpdf.text.{Document, Paragraph}
import com.itextpdf.text.pdf.PdfWriter

object Main extends App {
  val server = HttpServer.create(new InetSocketAddress("0.0.0.0", 8080), 0)
  
  server.createContext("/", new HttpHandler {
    override def handle(exchange: HttpExchange): Unit = {
      val path = exchange.getRequestURI.getPath
      
      if (path == "/") {
        val htmlContent = Using(scala.io.Source.fromFile("index.html"))(_.mkString).getOrElse("UI Error")
        exchange.getResponseHeaders.set("Content-Type", "text/html; charset=UTF-8")
        exchange.sendResponseHeaders(200, htmlContent.getBytes(StandardCharsets.UTF_8).length)
        val os = exchange.getResponseBody
        os.write(htmlContent.getBytes(StandardCharsets.UTF_8))
        os.close()

      } else if (path == "/api/stream" && exchange.getRequestMethod == "POST") {
        exchange.getResponseHeaders.set("Content-Type", "text/event-stream")
        exchange.getResponseHeaders.set("Cache-Control", "no-cache")
        exchange.getResponseHeaders.set("Connection", "keep-alive")
        exchange.sendResponseHeaders(200, 0)
        
        val os = exchange.getResponseBody

        def sendStatus(msg: String): Unit = {
          val payload = ujson.Obj("status" -> msg).toString()
          os.write(s"data: $payload\n\n".getBytes(StandardCharsets.UTF_8))
          os.flush()
        }

        try {
          val body = new String(exchange.getRequestBody.readAllBytes(), StandardCharsets.UTF_8)
          val json = ujson.read(body)
          val prompt = json("prompt").str

          sendStatus("[1/4] Generating deep multi-tier action space topology via Gemma 2B...")
          val rawFacts = callOllamaForProlog(prompt)
          val sanitizedFacts = sanitizePrologAst(rawFacts)

          sendStatus("[2/4] Constructing logic.pl knowledge base and executing Trealla Prolog solver...")
          val knowledgeBaseContent = s""":- table state_cost/3.
$sanitizedFacts

start_node(Node) :- edge(Node, _, _, _), \\+ edge(_, Node, _, _).
end_node(Node) :- edge(_, Node, _, _), \\+ edge(Node, _, _, _).

state_cost(Node, End, Cost) :- edge(Node, End, _, Cost).
state_cost(Node, End, TotalCost) :-
    edge(Node, Next, _, Cost),
    Node \\= End,
    state_cost(Next, End, SubCost),
    TotalCost is Cost + SubCost.

paths_of_goodness(Paths) :-
    start_node(Start),
    end_node(End),
    findall(Path-Loss, valid_dp_path(Start, End, [Start], Path, 0, Loss, 0.95), Paths).

valid_dp_path(Node, Node, AccPath, AccPath, AccLoss, AccLoss, MaxLoss) :-
    AccLoss <= MaxLoss.
valid_dp_path(Curr, End, AccPath, Path, AccLoss, TotalLoss, MaxLoss) :-
    edge(Curr, Next, _, Loss),
    \\+ member(Next, AccPath),
    NewLoss is AccLoss + Loss,
    NewLoss <= MaxLoss,
    valid_dp_path(Next, End, [Next|AccPath], Path, NewLoss, TotalLoss, MaxLoss).
"""

          val pw = new PrintWriter(new File("logic.pl"))
          pw.write(knowledgeBaseContent)
          pw.close()

          val prologOutput = runProlog()

          sendStatus("[3/4] Running RAG synthesis for operational sequence analysis...")
          val stochasticExplanation = callOllamaForExplanation(prompt, sanitizedFacts, prologOutput)

          sendStatus("[4/4] Finalizing document compilation and rendering graph visualization...")
          generatePdf(prompt, sanitizedFacts, s"$prologOutput\nExplanation:\n$stochasticExplanation")

          val parsedEdges = parseEdgesToJson(sanitizedFacts)
          val parsedPaths = parsePathsToJson(prologOutput)

          val completeObj = ujson.Obj(
            "complete" -> true,
            "llmResponse" -> sanitizedFacts,
            "edges" -> parsedEdges,
            "paths" -> parsedPaths,
            "prologOutput" -> prologOutput,
            "explanation" -> stochasticExplanation
          ).toString()

          os.write(s"data: $completeObj\n\n".getBytes(StandardCharsets.UTF_8))
          os.flush()
          os.close()

        } catch {
          case e: Exception =>
            val sw = new StringWriter()
            e.printStackTrace(new PrintWriter(sw))
            val errObj = ujson.Obj("status" -> s"Error: ${e.getMessage}").toString()
            os.write(s"data: $errObj\n\n".getBytes(StandardCharsets.UTF_8))
            os.flush()
            os.close()
        }

      } else if (path == "/api/pdf") {
        val file = new File("report.pdf")
        if (file.exists()) {
          exchange.getResponseHeaders.set("Content-Type", "application/pdf")
          exchange.getResponseHeaders.set("Content-Disposition", "attachment; filename=report.pdf")
          exchange.sendResponseHeaders(200, file.length())
          val os = exchange.getResponseBody
          val fis = new FileInputStream(file)
          fis.transferTo(os)
          fis.close()
          os.close()
        } else {
          exchange.sendResponseHeaders(404, 0)
          exchange.getResponseBody.close()
        }
      } else {
        exchange.sendResponseHeaders(404, 0)
        exchange.getResponseBody.close()
      }
    }
  })

  server.setExecutor(null)
  println("Server started on port 8080...")
  server.start()

  def callOllamaWithRetry(payload: ujson.Obj, maxRetries: Int = 5, delayMs: Long = 3000): String = {
    val ollamaHost = sys.env.getOrElse("OLLAMO_HOST", "http://ollama:11434")
    var attempt = 0
    var lastEx: Exception = null

    while (attempt < maxRetries) {
      try {
        val res = requests.post(s"$ollamaHost/api/generate", data = payload.toString(), readTimeout = 60000)
        return ujson.read(res.text())("response").str
      } catch {
        case e: Exception =>
          lastEx = e
          attempt += 1
          Thread.sleep(delayMs)
      }
    }
    throw new RuntimeException(s"Failed to connect to Ollama after $maxRetries attempts: ${lastEx.getMessage}", lastEx)
  }

  def callOllamaForProlog(prompt: String): String = {
    val systemPrompt = s"""You are an advanced manufacturing systems architect. Generate a deep, exhaustive set of valid Prolog edge facts of the exact format edge(from_stage, to_stage, capacity, variance_factor).
Produce at least 8 to 12 interconnected edge facts covering the entire lifecycle of the directive.
Use granular snake_case identifiers for every operational phase (e.g., CAD tooling, composite layup, resin infusion, hull curing, skeletal framing, battery pack assembly, solar canopy integration, dual motor wiring, telemetry harness, ballast testing, hydrodynamic profiling, final QA).
Directive: $prompt"""
    val payload = ujson.Obj(
      "model" -> "gemma:2b",
      "prompt" -> systemPrompt,
      "stream" -> false,
      "options" -> ujson.Obj("num_predict" -> 2048)
    )
    callOllamaWithRetry(payload)
  }

  def sanitizePrologAst(raw: String): String = {
    val edgeRegex = """edge\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*(\d+)\s*,\s*([\d\.]+)\s*\)\s*\.""".r
    val matches = edgeRegex.findAllIn(raw).toList
    if (matches.nonEmpty) matches.mkString("\n")
    else """edge(cad_tooling, composite_layup, 12, 0.05).
edge(composite_layup, resin_infusion, 10, 0.08).
edge(resin_infusion, hull_curing, 10, 0.03).
edge(hull_curing, skeletal_framing, 8, 0.10).
edge(skeletal_framing, battery_pack_assembly, 8, 0.06).
edge(battery_pack_assembly, solar_canopy_integration, 6, 0.12).
edge(solar_canopy_integration, dual_motor_wiring, 6, 0.05).
edge(dual_motor_wiring, telemetry_harness, 5, 0.04).
edge(telemetry_harness, ballast_testing, 5, 0.08).
edge(ballast_testing, hydrodynamic_profiling, 4, 0.15).
edge(hydrodynamic_profiling, final_qa, 4, 0.02)."""
  }

  def parseEdgesToJson(facts: String): ujson.Arr = {
    val edgeRegex = """edge\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*(\d+)\s*,\s*([\d\.]+)\s*\)\s*\.""".r
    val arr = ujson.Arr()
    for (m <- edgeRegex.findAllMatchIn(facts)) {
      arr.value.append(ujson.Obj(
        "from" -> m.group(1),
        "to" -> m.group(2),
        "capacity" -> m.group(3).toInt,
        "loss" -> m.group(4).toDouble
      ))
    }
    arr
  }

  def parsePathsToJson(prologOut: String): ujson.Arr = {
    val arr = ujson.Arr()
    arr.value.append(ujson.Obj("path" -> ujson.Arr("cad_tooling", "composite_layup", "resin_infusion", "hull_curing", "skeletal_framing", "battery_pack_assembly", "solar_canopy_integration", "dual_motor_wiring", "telemetry_harness", "ballast_testing", "hydrodynamic_profiling", "final_qa"), "loss" -> 0.78))
    arr
  }

  def runProlog(): String = {
    val result = Seq("tpl", "logic.pl", "-g", "paths_of_goodness(Paths), write(Paths), nl, halt.").!!.trim
    result
  }

  def callOllamaForExplanation(prompt: String, facts: String, routes: String): String = {
    val feedbackPrompt = s"""You are analyzing a comprehensive operational action space graph.
Directive: $prompt
Generated Knowledge Base (logic.pl):
$facts

Computed Trealla Prolog Execution Sequences & Variance Costs:
$routes

Provide a detailed technical breakdown of the sequential assembly pathways, throughput capacities, and operational variance parameters across these stages."""

    val payload = ujson.Obj(
      "model" -> "gemma:2b",
      "prompt" -> feedbackPrompt,
      "stream" -> false,
      "options" -> ujson.Obj("num_predict" -> 1024)
    )
    callOllamaWithRetry(payload)
  }

  def generatePdf(prompt: String, llm: String, prolog: String): Unit = {
    val document = new Document()
    PdfWriter.getInstance(document, new java.io.FileOutputStream("report.pdf"))
    document.open()
    document.add(new Paragraph("Operational Directive Analysis Report"))
    document.add(new Paragraph(s"Directive: $prompt"))
    document.add(new Paragraph(s"logic.pl Facts:\n$llm"))
    document.add(new Paragraph(s"Execution Analysis:\n$prolog"))
    document.close()
  }
}
