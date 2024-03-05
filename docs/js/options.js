(function ($) {
    "use strict";

    GetProfiles();

    jQuery(document).ready(function ($) {
        reload();

        function updateTextbox() {
            document.getElementById("profileText").value =
                JSON.stringify(profiles);
        }

        // Theme callback
        $("#themes").change(function (event) {
            var stylesheet = $("#themes").val();
            window.themeSetup(stylesheet);
            profiles[profilesKey][profiles.current].style = stylesheet;
            SetProfiles();
            reload();
        });

        $("#userProfiles").change(function (event) {
            profiles.current = $(this).val();
            SetProfiles();
            reload();

            $("li .checkbox .completed").show();
        });

        $("#profileAdd").click(function () {
            $("#profileModalTitle").html("Add Profile");
            $("#profileModalName").val("");
            $("#profileModalAdd").show();
            $("#profileModalUpdate").hide();
            $("#profileModalDelete").hide();
            $("#profileModal").modal("show");
        });

        $("#profileEdit").click(function () {
            $("#profileModalTitle").html("Edit Profile");
            $("#profileModalName").val(profiles.current);
            $("#profileModalAdd").hide();
            $("#profileModalUpdate").show();
            if (canDelete()) {
                $("#profileModalDelete").show();
            } else {
                $("#profileModalDelete").hide();
            }
            $("#profileModal").modal("show");
        });

        function profileAddSubmit() {
            var profile = $.trim($("#profileModalName").val());
            if (profile.length > 0) {
                initializeProfile(profile);

                profiles.current = profile;
                SetProfiles();
                reload();
                populateProfiles();
            }
        }

        $("#profileModalAdd").click(function (event) {
            profileAddSubmit();
        });

        $("#profileModalName").on("keypress", function (e) {
            if (e.which === 13) {
                $(this).attr("disabled", "disabled");
                profileAddSubmit();
                $(this).removeAttr("disabled");
                $("#profileModal").modal("hide");
            }
        });

        $("#profileModalUpdate").click(function (event) {
            event.preventDefault();
            var newName = $.trim($("#profileModalName").val());
            if (newName.length > 0 && newName != profiles.current) {
                profiles[profilesKey][newName] =
                    profiles[profilesKey][profiles.current];
                delete profiles[profilesKey][profiles.current];
                profiles.current = newName;
                SetProfiles();
                populateProfiles();
                reload();
            }
            $("#profileModal").modal("hide");
        });

        $("#profileModalDelete").click(function (event) {
            $("#deleteModal").modal("show");
        });

        $("#deleteYes").click(function (event) {
            $("#deleteModal").modal("hide");
            event.preventDefault();
            if (!canDelete()) {
                myalert("Failed to delete", "danger");
                return;
            }
            delete profiles[profilesKey][profiles.current];
            profiles.current = getFirstProfile();
            SetProfiles();
            populateProfiles();
            $("#profileModal").modal("hide");
            reload();
            myalert("Successfully deleted profile", "success");
        });

        $("#profileNG\\+").click(function () {
            $("#NG\\+Modal").modal("show");
        });

        $("#NG\\+ModalYes").click(function (event) {
            event.preventDefault();
            $(
                '[id^="playthrough_"], [id^="npc_quests_"], [id^="bosses_"], [id^="legacy_"], [id^="caves_"], [id^="evergaols_"], [id^="paintings"]',
            )
                .filter(":checked")
                .each(function () {
                    profiles[profilesKey][profiles.current].checklistData[
                        this.id
                    ] = false;
                });
            if (profiles[profilesKey][profiles.current].journey < 3) {
                profiles[profilesKey][profiles.current].journey++;
            }
            SetProfiles();
            $("#NG\\+Modal").modal("hide");
            reload();
            myalert("NG+ Started", "success");
        });

        $("#profileExport").click(function () {
            var filename = "profiles.json";
            var text = JSON.stringify(profiles);
            if (window.Blob && window.navigator.msSaveBlob) {
                // Microsoft browsers (https://docs.microsoft.com/en-us/microsoft-edge/dev-guide/html5/file-api/blob)
                var blob = new window.Blob([text]);
                window.navigator.msSaveBlob(blob, filename);
            } else {
                // All other modern browsers
                var element = document.createElement("a");
                element.setAttribute(
                    "href",
                    "data:text/plain;charset=utf-8," + encodeURIComponent(text),
                );
                element.setAttribute("download", filename);
                element.style.display = "none";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            }
        });

        $("#profileImport").click(function () {
            $("#fileInput").trigger("click");
        });
        /* Will reject if an incorrect file or no file is selected */
        $("input#fileInput").change(function () {
            var fileInput = document.getElementById("fileInput");
            if (
                !fileInput.files ||
                !fileInput.files[0] ||
                !/\.json$/.test(fileInput.files[0].name)
            ) {
                myalert("Bad input file. File should end in .json", "danger");
                return;
            }
            var fr = new FileReader();
            fr.readAsText(fileInput.files[0]);
            fr.onload = dataLoadCallback;
        });

        function myalert(message, type) {
            var wrapper = document.createElement("div");
            wrapper.innerHTML =
                '<div class="alert alert-' +
                type +
                ' alert-dismissible" role="alert">' +
                message +
                '<button type="button" class="btn-close" data-bs-dismiss="alert"</button></div>';

            $("#alert-div").append(wrapper);
        }

        /*
         *  Import & Export using textarea instead of files
         */
        $("#profileExportText").click(function () {
            document.getElementById("profileText").value =
                JSON.stringify(profiles);
            document.getElementById("profileText").select();
            document.execCommand("copy");
        });

        $("#profileImportText").click(function () {
            $("#importTextModal").modal("show");
        });

        $("#importTextYes").click(function () {
            $("#importTextModal").modal("hide");
            try {
                var jsonProfileData = JSON.parse(
                    document.getElementById("profileText").value,
                );
                profiles = jsonProfileData;
                SetProfiles();
                reload();
            } catch (e) {
                myalert(e, "danger");
                return;
            }

            myalert("Successfully imported", "success");
        });

        function dataLoadCallback(arg) {
            console.log("dataloadcallback");
            var jsonProfileData = JSON.parse(arg.currentTarget.result);
            profiles = jsonProfileData;
            populateProfiles();
            $("#userProfiles").trigger("change");
            reload();
            myalert("Successfully imported", "success");
        }

        function reload() {
            window.themeSetup(buildThemeSelection());
            populateProfiles();
            updateTextbox();
        }

        reload();
    });

    function buildThemeSelection() {
        var style = profiles[profilesKey][profiles.current].style;
        var themeSelect = $("#themes");
        $.each(themes, function (key, value) {
            themeSelect.append(
                $("<option></option>")
                    .val(key)
                    .html(key + " Theme"),
            );
        });
        themeSelect.val(style);
        return style;
    }

    function populateProfiles() {
        $("#userProfiles").empty();
        $.each(profiles[profilesKey], function (index, value) {
            $("#userProfiles").append(
                $("<option></option>").attr("value", index).text(index),
            );
        });
        $("#userProfiles").val(profiles.current);
    }

    function canDelete() {
        var count = 0;
        $.each(profiles[profilesKey], function (index, value) {
            count++;
        });
        return count > 1;
    }

    function getFirstProfile() {
        for (var profile in profiles[profilesKey]) {
            return profile;
        }
    }
})(jQuery);
