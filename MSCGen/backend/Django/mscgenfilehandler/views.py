from django.core.files.storage import default_storage
from django.http import HttpResponse
from django.shortcuts import render
from django.core.files.base import ContentFile
from django.views.decorators.csrf import csrf_exempt



def index(request):
    return render(request, "index.html")


@csrf_exempt
def fileSave(request):
    if request.method == "POST" and request.POST.get("text"):
        request.POST.get("text")
        content = ContentFile(request.POST.get("text"))
        return HttpResponse(default_storage.save("F", content))
    return HttpResponse("error")

@csrf_exempt
def fileGet(request, path):
    if request.method == "GET" and default_storage.exists(path):
        text = default_storage.open(path, "r")
        return HttpResponse(text)
    return HttpResponse("error")
